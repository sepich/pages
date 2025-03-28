---
title: IngressNightmare and nginx.conf validation
date: 2025-03-27T20:03:01+01:00
tags:
   - nginx
---
This is about CVE response in [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) which broke functionality of Admission Webhook.

### The Catch
Here are [the news](https://github.com/advisories/GHSA-mgvx-rpfc-9mpv) we've got:
> A security issue was discovered in Kubernetes where under certain conditions, an unauthenticated attacker with access to the pod network can achieve arbitrary code execution in the context of the ingress-nginx controller. This can lead to disclosure of Secrets accessible to the controller. (Note that in the default installation, the controller can access all Secrets cluster-wide.)

There are usually 2 kinds of reaction:

- In [Media](https://x.com/hashtag/ingressnightmare):

   ![](/assets/img/2025/aaa.png)
   { width="300px" }

- And if you're already using ingress-nginx for a while:
*"New month, new CVE, boring. Another 'security researcher' found how to use configuration-snippet?"*

Because in the default configuration ingress-nginx runs `controller` and `nginx` in single container. At the same time `controller` needs access to all cluster Secrets, and that is done via attaching ServiceAccount to the Pod. That means that SA token [would be mounted](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/#serviceaccount-admission-controller) to `/var/run/secrets/kubernetes.io/serviceaccount`. Which you can then serve as file via `nginx` and leak it. To fix that you usually run `controller-chroot` image, where `nginx` process is scoped to `/chroot` dir and cannot access folder `/var/run/secrets` above it.

Ok, let's just install minor update version, which fix the CVE, right? Sure:
https://github.com/kubernetes/ingress-nginx/releases/tag/controller-v1.11.5
> Unfortunately, to fix [CVE-2025-1974](https://github.com/advisories/GHSA-mgvx-rpfc-9mpv "CVE-2025-1974") it was necessary to disable the validation of the generated NGINX configuration during the validation of Ingress resources.
> The resulting NGINX configuration is still checked before the actual loading, so that there are no failures of the underlying NGINX. However, invalid Ingress resources can lead to the NGINX configuration no longer being able to be updated.

And that is a big no-no. In our case we have development/hackathon multi-tenant clusters where users learn k8s, so they submit all incorrect variants of `Ingress` object possible. If we disable Admission Validation for `Ingress` that means nginx configuration would become broken, human receive alert, and now time is wasted from both sides. First to to find the invalid Ingress and fix it, and then to communicate to it's owner.

### The Options

But if it is really "arbitrary code execution in the context of the ingress-nginx controller" it changes everything, because `controller` actually has access to Secrets. We need more technical details, so let's go to [original finding by Wiz](https://www.wiz.io/blog/ingress-nginx-kubernetes-vulnerabilities#cve-2025-1974---nginx-configuration-code-execution-70) (which was done back in 2024!)
In short:
>1. Upload our payload in the form of a shared library to the pod by abusing the client-body buffer feature of NGINX 
>2. Send an AdmissionReview request to the Ingress NGINX Controller’s admission controller, which contains any one of our directive injections   
>3. The directive we inject is the `ssl_engine` directive, which will cause NGINX to load the specified file as a shared library

So it is RCE, but still in the scope of `nginx` process and not of a `controller`. And they use `load_module` directive, which is [blocked by default](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/#annotation-value-word-blocklist) via `annotation-value-word-blocklist`. Here is example for unpatched v1.11.4:

```bash
# in Ingress annotations:
    nginx.ingress.kubernetes.io/auth-url: |
      http://a.com;
      load_module a;
# test
$ k diff -f ingress-test.yml
Error from server (BadRequest): admission webhook "validate.nginx.kubernetes.io" denied the request: nginx.ingress.kubernetes.io/auth-url annotation contains invalid word load_module
```

Does not seem like a big deal, so why such a bold measure as the complete disable of validation was chosen? Unfortunately the [original PR](https://github.com/kubernetes/ingress-nginx/pull/13070) has no any discussion in it.

And we now have no way to upgrade to further versions, as we hardly need this validation. So, I've thought that maybe it is possible to still enable validation for `controller-chroot` image (non-default) and drafted the PR:
https://github.com/kubernetes/ingress-nginx/pull/13098
But as you can see, maintainers do not consider any way of enabling it back.

So what options do we have if we still want **to have Admission** Review?
1. **Do nothing.**
   Just continue to use `controller-chroot` image <`v1.11.5` But now we could have a bad sleep (i.e "nightmares").
2. **Use fork.**
   We can use our fork with validation re-enabled for chroot image. And then have to support it, at least merging in upstream from time to time. And RCE still possible here, sleep quality is still bad.
3. **Separate Webhook from Nginx.**
   That could be done with upstream images, and should prevent the RCE as described. But token is still there.
4. **Use fork and separate**
   There is no need for Secrets access if you only want to validate `nginx.conf`. Create a fork, which only serves Webhook, and run it with separate KSA having no access to Secrets.

### The Workaround
For now we end up with option #3, which is quick to do:
- Install ingress-nginx as usual, but with admission controller disabled (i.e no arg `--validating-webhook` specified) This deployment serving main traffic with nginx. And the version could be easily upgraded.
- Now create separate Deployment with `--validating-webhook` arg, that would only serve Admission Review traffic. For that we would also need another `Service` and  a `ValidatingWebhookConfiguration` object. Here we fix older version (i.e v1.11.4).
- But this second deployment still have both `nginx` and `webhook` sharing the same FS and accessible for requests from "pod network". To prevent this let's copy the original configMap and add `bind-address: 127.0.0.1` to it. Then attach this `cm` to `webhook` deployment only. That makes `nginx` not accessible from outside the Pod.
- Note that both `ingress-nginx` and `ingress-webhook` deployments should share same `--election-id` and `--controller-class`. Because they still do leader election, and it could be your webhook pod becoming master and updating `Ingress` objects statuses.
- You can even port v1.11.5 [fixes for quoting](https://github.com/kubernetes/ingress-nginx/pull/13070/files#diff-cbf382cc05c9f274b5db56a581b335dba8ecb80fd96a8f1a6a068b2594c9b1ca) to v1.11.4 webhook with:
   ```yaml
   containers:
     - command:
         - sh
         - -c
         - |
             sed 's/CertificateAuth.MatchCN }}/CertificateAuth.MatchCN | quote }}/' -i /chroot/etc/nginx/template/nginx.tmpl
             sed 's/externalAuth.URL }};/externalAuth.URL | quote }};/' -i /chroot/etc/nginx/template/nginx.tmpl
             sed 's/location.Mirror.Source }};/location.Mirror.Source | quote }};/' -i /chroot/etc/nginx/template/nginx.tmpl
   
             exec /nginx-ingress-controller "$@"
       args:
         - /nginx-ingress-controller
         ...
   ```
  Just to make webhook checked config to look more like executed in nginx pods.

Is this validation is important for us only? Why validation was just commented in the code with TODO, and not removed? Will see what will come with next upstream versions...
