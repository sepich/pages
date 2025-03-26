---
title: Asterisk sync with Active Directory
date: '2012-04-05T15:38:00.000+04:00'
tags:
- windows
- linux
modified: '2012-04-05T15:42:15.521+04:00'
thumbnail: /assets/img/2012/pbx1.png
url: /2012/04/asterisk-sync-with-active-directory.html
---
In my case, all users information is stored in AD (yes, we use Exchange GAL). It'll be great if asterisk get this information directly from AD without need in configuration editing.

Let's look what we have now - AD user have fields:  
`telephoneNumber` - for internal extension number   
`fax` - for direct inward dialing number (DID) like this:  

![](/assets/img/2012/pbx1.png)
{ width="320px" .left }
![](/assets/img/2012/pbx2.png)
{ width="320px" .right }

<div style="clear:both"></div>

From the asterisk side:  
`users.conf`  
```ini
[lan](!)
type=peer
host=dynamic
...

;And all users as child from this template

[502](lan)
fullname = Ryabov; Needed for username display on snom phones
secret = *** ;Your super secret password
email = ryabov@domain.ru; I use for fax to email
callgroup = 1; Number of room for call pickup
pickupgroup = 1
context = 1234567; DID for external calls
```
All my DIDs with same context name in `sip.conf`:  
```ini
[1234567]
type=friend
host=8.8.8.8
fromuser = 1234567
secret = ***
context=from-sats
...
```
Outgoing extensions, same as DIDs. `extensions.conf`:  
```ini
[1234567]
include => dial_internal
exten => _XXX.,1,Dial(SIP/1234567/${EXTEN},60);
same => n,Hangup;

;Incoming calls
[from-sats]
exten => 1234567,1,SIPAddHeader("Alert-Info:<http://nohost>\;info=alert-external\;x-line-id=0"); Different ring melody for external calls
same => n,Dial(SIP/502&SIP/503,60,r); Internal number to dial
same => n,Hangup;
```
  
So what is possible to automate here? In my case we have different correspondence between DID and internal number for incoming calls. But always have one DID for external calls, which is stored in AD in user info. My idea in brief - dynamically generate `users.conf` by information provided in AD. No need any changes to` sip.conf `and `extensions.conf `outgoing calls section. For incoming calls section - it's impossible to automate, because all departments want custom incoming dialplan for their's DID.  

Ok, let's do it!) All we need is PHP installed with `extension=php_ldap.so` in `php.ini `enabled.  
Save this script as `/etc/asterisk/ldap.php` and `cmod +x` it:  
```php
#!/usr/bin/php
<?
//config------------------------------------------------------------------------
$cache='/etc/asterisk/users.cache'; //cache used when no connection to DC
$ldap['srv']='dc.domain.ru';        //LDAP server
$ldap['user']='svc@domain.ru';      //user to bind with
$ldap['pass']='***';                //user password
$ldap['dn']='DC=domain,DC=ru';      //DN path to filter users
$conf['tpl']='lan';                 //template name in users.conf
$conf['mail']='ryabov@domain.ru';   //error notify
 //------------------------------------------------------------------------------
$error='';
$out='';

$ldap['dc'] = ldap_connect($ldap['srv']) or die("Could not connect to LDAP!</br>");
ldap_set_option($ldap['dc'],LDAP_OPT_PROTOCOL_VERSION, 3);
ldap_set_option($ldap['dc'],LDAP_OPT_REFERRALS, 0);
if(ldap_bind($ldap['dc'], $ldap['user'], $ldap['pass'])) {
  $filter = "(&(telephoneNumber=*)(objectCategory=user)(objectClass=user)(samAccountName=*))";
  $attr=array('samaccountname','telephoneNumber','facsimileTelephoneNumber', 'userPrincipalName');
  if($result=ldap_search($ldap['dc'], $ldap['dn'], $filter, $attr)){
    $info = ldap_get_entries($ldap['dc'], $result);
    for($i=0; $i<$info['count']; $i++){
      $num=$info[$i]['telephonenumber'][0];
      $login=$info[$i]['samaccountname'][0];
      $login=strtoupper( substr($login,0,1) ).substr($login,1);
      $context=(array_key_exists('facsimiletelephonenumber', $info[$i]))?$info[$i]['facsimiletelephonenumber'][0]:'users';
      $grp=$num[0];
      $mail=$info[$i]['userprincipalname'][0];
      $out.="
[$num]({$conf['tpl']})
fullname = $login
secret = *** ; generate your super password here
email = $mail
callgroup = $grp
pickupgroup = $grp
context = $context
";
    }
  } else $error="Unable to search ldap server<br>msg:'".ldap_error($ldap['dc'])."'</br>";
} else $error="LDAP bind failed!";

if($error || !$out) {
  mail($conf['mail'], 'LDAP sync error!', $error);
  $out=file_get_contents($cache);
} else file_put_contents($cache,$out);

echo $out;
?>
```
As you see, we use AD field `facsimileTelephoneNumber` for our DID numbers. Test this script - it must generate needed part of `users.conf` without template. It must work even without connection to LDAP server, read data from its cache and send you error report by mail. (You need to [make mail configured](/2011/09/debian-mail-notification-by-gmail.html">) for this to work)  
If script works as you need - include it to `users.conf` after SIP user template, like this  
```ini
[lan](!)
type=peer
host=dynamic
...

#exec /etc/asterisk/ldap.php
```
And clear all your old extensions lines for SIP users, bc this script wil generate them for you.   
To make exec-includes work in asterisk you need to edit `asterisk.conf` too.  
```ini
[options]
execincludes = yes; Support #exec in config files.
```

Test this by `sip reload` and check by `sip show peers` - you must get all your SIP users right from AD every time you make `sip reload`.  
And last step - add user sync run by schedule:  
```bash
# crontab -e
*/10 8-20 * * * /usr/sbin/asterisk -rx "sip reload"
```
Upper line means run every 10 minutes from 8am till 8pm every day.  
Now your juniors can manage users right from AD and do not disturb you.
