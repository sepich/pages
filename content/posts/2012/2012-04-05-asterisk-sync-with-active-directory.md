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

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2012-09-20T18:13:42.452+04:00">18:13, 20 September 2012</time>:<br/>
А как сделать скрипт который просто будет получать имя звонящего на телефон с лдап. Просматривая внутренний номер ну и мобильный</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2012-09-20T20:25:37.547+04:00">20:25, 20 September 2012</time>:<br/>
Есть 2 решения:<br />1. Написать AGI скрипт, который будет перехватывать событие звонка и подставлять нужный clid<br />2. Тут вопрос уже к телефонному аппарату, который этот номер собирается получить. Вроде у linksys есть возможность переходить по ссылке при звонке для получения номера, или загрузке адресной книги. Тут уже зависит от формата, который у каждого производителя свой. Т.е. нужно переделать, например, PHP-скрипт выше так, чтобы он отдавал адреску в нужном формате и вывесить его через апач, а на телефоне настроить путь к скрипту.</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2012-09-21T10:16:48.988+04:00">10:16, 21 September 2012</time>:<br/>
Ну собственно телефон Grandstream gxp 1405 пока станция не вылетела и не потерялся весь функционал. То в настройка конфиг файла для телефона была сылка на тел книгу вида, http://ххх.хх.ххх.х/gs_phonebook.php<br />Ну сам скрипт утерян , вот и думаю как лучше восстановить функционал. Находил вариант через ldapsearch shell ( perl скрипт ) но что-то не пашет , да и в контролере информацию надо конвертить в UTF<br /></div>
<div class="comment"><img src="//www.blogger.com/img/blogger_logo_round_35.png"/><a href="https://www.blogger.com/profile/03461266324042514849">Unknown</a> at <time datetime="2013-01-11T13:21:56.869+04:00">13:21, 11 January 2013</time>:<br/>
Спасибо за скрипт, но у меня появился один вопрос. У меня возникла проблема фильтром по нестандартных полям LDAP (нужно экспортировать аккаунты из Zimbra). К примеру мы хотим хранить пароли пользователей в поле zimbraNotes, но скрипт напрочь отказывается видеть это поле. filter и attr правил соответствующим образом:<br />$filter = &quot;(&amp;(telephoneNumber=*)(objectClass=zimbraAccount)(uid=*))&quot;;<br />$attr=array(&#39;cn&#39;,&#39;telephoneNumber&#39;,&#39;facsimileTelephoneNumber&#39;,&#39;mail&#39;,&#39;zimbraNotes&#39;);<br />Через ldapsearch фильтр работает правильно.<br /><br />Возможно php5-ldap не умеет вычитывать нестандартные поля?</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2013-01-11T13:43:10.022+04:00">13:43, 11 January 2013</time>:<br/>
Ситуацию негде сэмулировать, но я бы проверял так:<br />1. удалил из $filter часть с zimbraAccount и посмотрел будет ли вывод от ldap_search<br />2. удалить zimbraNotes из $attr и посмотреть есть ли вывод у ldap_search. Если есть - то возможно атрибут надо писать регистрозависимо<br />3. В зависимости от результата 1 и 2 копать решение дальше :)<br /></div>
<div class="comment"><img src="//www.blogger.com/img/blogger_logo_round_35.png"/><a href="https://www.blogger.com/profile/03461266324042514849">Unknown</a> at <time datetime="2013-01-11T13:49:50.423+04:00">13:49, 11 January 2013</time>:<br/>
собственно есть оставить только в $filter - вывод пустой (вроде как нет записей, попадающих под фильтр)<br />если оставляю только в $attr - дальше получаю ошибку мол Undefined index: zimbranotes (при любом регистре)</div>
<div class="comment"><img src="//www.blogger.com/img/blogger_logo_round_35.png"/><a href="https://www.blogger.com/profile/03461266324042514849">Unknown</a> at <time datetime="2013-01-11T13:51:25.979+04:00">13:51, 11 January 2013</time>:<br/>
такое такое впечатление, что php5-ldap просто игнорирует поля, которых нет в стандартных схемах.</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2013-01-11T14:02:16.269+04:00">14:02, 11 January 2013</time>:<br/>
Да вроде должно работать<br />http://php.net/manual/en/function.ldap-search.php<br />ничего не сказано про extended atributes<br />При этом по (google &quot;ldap_search&quot; zimbranotes)<br />первая ссылка<br />http://www.zimbra.com/forums/developers/10287-ldap-attributes-different-output-perl-php.html<br />см. последнюю цитату топикстартера</div>
<div class="comment"><img src="//www.blogger.com/img/blogger_logo_round_35.png"/><a href="https://www.blogger.com/profile/03461266324042514849">Unknown</a> at <time datetime="2013-01-11T14:51:05.150+04:00">14:51, 11 January 2013</time>:<br/>
Спасибо за наводку.<br />Оказалось все довольно банально, дополнительные поля, которые находятся в LDAP зимбры может читать только специальный пользователь, а я хотел их вычитать через обыкновенного юзверя.</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Marcin</a> at <time datetime="2014-12-10T01:54:36.608+03:00">01:54, 10 December 2014</time>:<br/>Is it possible to use also Active Directory password in Asterisk SIP authentication?</div>
