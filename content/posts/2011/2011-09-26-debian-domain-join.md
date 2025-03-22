---
title: Debian domain join
date: '2011-09-26T13:57:00.000+04:00'
tags:
- windows
- linux
modified: '2013-01-13T21:37:13.793+04:00'
thumbnail: /assets/img/2011/pbx.png
url: /2011/09/debian-domain-join.html
---
How to join Debian Squeeze to Active Directory Domain (winbind method).This makes possible to login as domain user, make samba shares with domain security, ntlm SSO to Apache sites, ntlm auth with Squid proxy.  

I'm starting with blank Debian Squeeze installation at server `pbx (192.168.7.2)`   
and Active Directory domain - `domain.ru` (Kerberos name `DOMAIN`)   
with DC `dc.domain.ru (192.168.7.1)`  
At first, we need to make sure clock is synchronized with AD, and DNS domain queries are correctly forwarded to DC.  

1. To forward domain DNS queries we have two ways: 
   - Add/replace in `/etc/resolv.conf` this line to forward all DNS queries to DC `nameserver 192.168.7.1` and supersede this params from updating by dhcp-client   
   ```bash
   # nano /etc/dhcp/dhclient.conf
   supersede domain-name "domain.ru";
   prepend domain-name-servers 192.168.7.1;
   ```
   - Or, if you use bind, add domain forwarding to `/etc/bind/named.conf.local`   
   ```conf
      zone "domain.ru" {
        type forward;
        forwarders {
          192.168.7.1;
        };
      };
   ```
Checking DNS resolution:  
   ```bash
      # dig domain.ru
      ;; QUESTION SECTION:
      ;domain.ru.                     IN      A
      
      ;; ANSWER SECTION:
      domain.ru.              600     IN      A       192.168.7.1
   ```
1. To sync clock we need `ntpdate` 
```bash
aptitude install ntpdate
echo 'NTPSERVERS="dc.domain.ru"'> /etc/default/ntpdate
ntpdate -s dc.domain.ru
```
Check time at DC and Debian, it must be synced second to second
1. Check `/etc/hosts` to include FQDN 
```
127.0.0.1       localhost
127.0.1.1       pbx.domain.ru        pbx
```
1. Ok, preparation completed, let's join domain :) At first we need kerberos packages:
```bash
# aptitude install krb5-doc krb5-user krb5-config
Default Kerberos version 5 realm: DOMAIN.RU
Kerberos servers for your realm: dc.domain.ru
Administrative server for your Kerberos realm: dc.domain.ru
```
Open `/etc/krb5.conf` and edit like this:
```ini
   [libdefaults]
   default_realm = DOMAIN.RU
   ticket_lifetime = 24000
   clock_skew = 300
   kdc_timesync = 1
   ccache_type = 4
   forwardable = true
   proxiable = true
   
   [realms]
   DOMAIN.RU = {
      kdc = dc.domain.ru
      admin_server = dc.domain.ru
   }
   
   [domain_realm]
   domain.ru = DOMAIN.RU
   domain.ru = DOMAIN.RU
   
   [login]
   krb4_convert = true
   krb4_get_tickets = false
   
   [logging]
   default = FILE:/var/log/krb5libs.log
   kdc = FILE:/var/log/krb5dc.log
   admin_server = FILE:/var/log/ksadmind.log
```
Here,`admin_server` - is the DC with **PDC Emulator** FSMO  
`kdc` - one or more strings with domain controllers names
1. Creating log files: 
```bash
touch /var/log/krb5libs.log
touch /var/log/krb5dc.log
touch /var/log/ksadmind.log
```
1. Trying to bind to AD: 
```bash
   # kinit Administrator
   Password for Administrator@DOMAIN.RU:
   # klist
   Ticket cache: FILE:/tmp/krb5cc_0
   Default principal: Administrator@DOMAIN.RU
   
   Valid starting     Expires            Service principal
   09/25/11 22:05:33  09/26/11 04:45:33  krbtgt/DOMAIN.RU@DOMAIN.RU
```
1. Ok, now install samba and winbind 
```bash
# aptitude install winbind samba
Workgroup/Domain Name: DOMAIN
```
...and configure `/etc/samba/smb.conf`
```ini
   [global]
   workgroup = DOMAIN
   server string = %h server
   wins support = no
   dns proxy = no
   interfaces = 127.0.0.0/8 eth0
   bind interfaces only = yes
   log file = /var/log/samba/log.%m
   max log size = 1000
   syslog = 0
   panic action = /usr/share/samba/panic-action %d
   security = ads
   ;AD
   admin users=Administrator
   auth methods = winbind
   case sensitive = no
   client signing = yes
   client ntlmv2 auth = yes
   client use spnego = yes
   debug level = 2
   domain master = no
   dos charset = 866
   encrypt passwords = true
   follow symlinks = yes
   idmap gid = 10000-40000
   idmap uid = 10000-40000
   local master = no
   log level = 1
   null passwords = true
   obey pam restrictions = yes
   os level = 0
   pam password change = yes
   passdb backend = tdbsam
   passwd chat = *Enter\snew\s*\spassword:* %n\n *Retype\snew\s*\spassword:* %n\n *password\supdated\ssuccessfully* .
   passwd program = /usr/bin/passwd %u
   password server = *
   preferred master = no
   realm = DOMAIN.RU
   socket options = TCP_NODELAY SO_SNDBUF=8192 SO_RCVBUF=8192
   template shell = /bin/bash
   unix charset = UTF-8
   unix password sync = yes
   use kerberos keytab = true
   winbind enum groups = yes
   winbind enum users = yes
   winbind nested groups = Yes
   #winbind separator = +
   winbind use default domain = yes
   
   [test]
   browseable = yes
   writeable = yes
   write list = @"Domain Users" @IT DOMAIN\sepa
   path = /tmp/test
   create mask = 0664
   comment = public share
   directory mask = 0777
   valid users = @"Domain Users" @IT DOMAIN\sepa
   
   [homes]
   comment = Home Directories
   browseable = no
   read only = no
   create mask = 0700
   directory mask = 0700
   valid users = DOMAIN\%S
```
..and test this: 
```bash
testparm
```
Some notes:  
`@IT` - group names, if name contain spaces, place it in quotes (`@"Domain Users"`)  
`DOMAIN\sepa` - username from domain
1. Make homedir for domain users 
```bash
mkdir /home/DOMAIN
```
1. Re-read config and join domain 
```
# /etc/init.d/winbind stop && /etc/init.d/samba restart && /etc/init.d/winbind start
# net ads join -U administrator
Enter administrator's password:
Using short domain name -- DOMAIN
Joined 'PBX' to realm 'domain.ru'
DNS update failed!
```
And looking to Active Directory Users and Computers   
![](/assets/img/2011/pbx.png)
1. Reloading and checking winbind info about domain users and groups 
```bash
/etc/init.d/winbind force-reload
wbinfo -u
wbinfo -g
```
1. Add auth by winbind to `/etc/nsswitch.conf`:
```bash
passwd: compat winbind
group: compat winbind
shadow: compat winbind
hosts: files dns
```
and check that domain users and groups are added 
```bash
getent passwd
getent group
```
1. Now setup login to Debian as domain users 
```bash
   # nano /etc/pam.d/common-account
   account [success=2 new_authtok_reqd=done default=ignore]        pam_unix.so
   account [success=1 new_authtok_reqd=done default=ignore]        pam_winbind.so
   
   # nano /etc/pam.d/common-auth
   auth    [success=2 default=ignore]      pam_unix.so nullok_secure
   auth    [success=1 default=ignore]      pam_winbind.so require_membership_of={SID} krb5_auth krb5_ccache_type=FILE cached_login try_first_pass
```
Here `{SID}` is AD SID of group you want to give access to login to debian server. Members of this group only can login, this does not grant any rights. We also enable cached logins, so we can login with domain credentials when domain is not accessible (if we've already login with this user before) 
```bash
# nano /etc/pam.d/common-password
password        [success=2 default=ignore]      pam_unix.so obscure sha512
password        [success=1 default=ignore]      pam_winbind.so use_authtok try_first_pass
```
1. Automatically make homedir folder for new users 
```bash
# nano /etc/pam.d/common-session
session required pam_mkhomedir.so skel=/etc/skel/ umask=0022
```
1. Give some AD group rights to sudo as root: 
```bash
# visudo
%adgroup        ALL=(ALL) ALL
```
If you want to use group with spaces in its name - use `\ ` instead spaces (`%domain\ admins`) 

That's all. Try to reboot and login as domain user.   
`shutdown -r now`  
If you have same name for local admin user on debian, and in AD, you can make symlink of homedir   
`ln -s /home/sepa/ /home/DOMAIN/`  
When you login by ssh you can use one login name and both passwords (from local user or AD user)
