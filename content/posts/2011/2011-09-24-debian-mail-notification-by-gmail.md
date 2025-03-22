---
title: Mail notifications by GMail from Debian
date: '2011-09-24T22:24:00.000+04:00'
tags:
- linux
modified: '2011-09-25T00:53:13.422+04:00'
thumbnail: /assets/img/2011/deb.png
url: /2011/09/debian-mail-notification-by-gmail.html
---
Описание настройки Debian Exim4 для рассылки почты через GMail apps for domain для получения уведомлений на почту из cron и скриптов.  

По умолчанию в Debian Squeeze установлен MTA Exim4. Настройка осуществляется командой    
`dpkg-reconfigure exim4-config`  
выбираем отправку почты наружу, и отключение локальной почты  
`General type of mail configuration: mail sent by smarthost; no local mail`
вводим доменное имя  
`System mail name: domain.ru`  
оставляем адреса по которым необходимо слушать только локальные. Т.к. почтовый сервер будет использоваться только для писем с локальной машины.
`IP-addresses to listen on for incoming SMTP connections: 127.0.0.1 ; ::1`  
убеждаемся что локальный домен не совпадает с доменом ваших почтовых адресов    
`Other destinations for which mail is accepted: debian.domain.ru`  
Видимое имя домена тоже не трогаем, чтобы письмо с сервера содержали имя сервера.  
`Visible domain name for local users: debian.domain.ru`  
адрес червера, на который пересылать почту  
`IP address or host name of the outgoing smarthost: smtp.gmail.com::587`    
т.к. у нас dns всегда доступен, то не урезать dns-запросы  
`keep number of DNS-queries minimal: No`  
Не сохранять конфиг в мелкие файлы, а оставить одним файлом  
`Split configuration into small files? No`  
Запускаем  
`nano /etc/exim4/passwd.client`  
и вводим учетную запись GMail от имени которой будет отправляться почта.      
`*.gmail.com:yourAccountName@domain.ru:y0uRpaSsw0RD`  
убеждаемся в том, что права на файл только у root и exim  
```bash
ls -l /etc/exim4/passwd.client
-rw-r----- 1 root Debian-exim 239 Sep 24 21:17 /etc/exim4/passwd.client
```
если не так, то выполняем
```
chown root:Debian-exim /etc/exim4/passwd.client
chmod 640 /etc/exim4/passwd.client
```
перечитываем изменения в конфиге `update-exim4.conf`, проверяем отправку почты, делаем вызов sendmail с полным debug
```
sendmail -d i@sepa.spb.ru
test
.
```
вводим текст письма, который заканчивается точкой в начале пустой строки. Наше письмо не отправилось:
```
LOG: MAIN
  ** root@domain.ru R=smarthost T=remote_smtp_smarthost: SMTP error from remote mail server after MAIL FROM:<>; SIZE=2402: host gmail-smtp-msa.l.google.com [74.125.43.108]: 530-5.5.1 Authentication Required. Learn more at\n530 5.5.1 http://mail.google.com/support/bin/answer.py?answer=14257
```
Из-за того что при отправке наш адрес smarthost был зарезолвлен в IP, а потом IP через reverse dns lookup в имя хоста `gmail-smtp-msa.l.google.com` Это имя хоста искалось в `/etc/exim4/passwd.client` для получения строки авторизации
  
```
file lookup required for gmail-smtp-msa.l.google.com
  in /etc/exim4/passwd.client
gmail-smtp-msa.l.google.com in "*.gmail.com"? no (end of list)
lookup failed
```
открываем `/etc/exim4/passwd.client` и исправляем/добавляем строку авторизации на  
`*.google.com:yourAccountName@domain.ru:y0uRpaSsw0RD`  
не забываем сделать    
`update-exim4.conf`  
и пробуем отправить почту еще раз    
```
root@debian:/home/sepa# sendmail i@sepa.spb.ru
test2
.
root@debian:/home/sepa# tail /var/log/exim4/mainlog
2011-09-24 21:40:35 1R7WCS-0000sV-Iy Completed
2011-09-24 21:40:36 1R7WDL-0000sg-B6 ** root@domain.ru R=smarthost T=remote_smtp_smarthost: SMTP error from remote mail server after MAIL FROM:<>; SIZE=2402: host gmail-smtp-msa.l.google.com [74.125.43.108]: 530-5.5.1 Authentication Required. Learn more at\n530 5.5.1 http://mail.google.com/support/bin/answer.py?answer=14257 z7sm14961556bkt.5
2011-09-24 21:40:36 1R7WDL-0000sg-B6 Frozen (delivery error message)
2011-09-24 21:44:15 Start queue run: pid=3393
2011-09-24 21:44:15 1R7WDL-0000sg-B6 Message is frozen
2011-09-24 21:44:15 1R7W1G-0000rd-Rs Message is frozen
2011-09-24 21:44:15 End queue run: pid=3393
2011-09-24 21:54:40 1R7WQv-0000xE-0z <= root@domain.ru U=root P=local S=296
2011-09-24 21:54:44 1R7WQv-0000xE-0z => i@sepa.spb.ru R=smarthost T=remote_smtp_smarthost H=gmail-smtp-msa.l.google.com [74.125.43.109] X=TLS1.0:RSA_ARCFOUR_SHA1:16 DN="C=US,ST=California,L=Mountain View,O=Google Inc,CN=smtp.gmail.com"
2011-09-24 21:54:44 1R7WQv-0000xE-0z Completed
```
На этот раз письмо отправлено и получено :)  
![](/assets/img/2011/deb.png)  
Но исходящий адрес, какой бы вы не указывали, будет заменен гуглом на тот, под логином которого было отправлено письмо. Для целей нотификации это не имеет значения. Для разных служб можно указывать разный `FromName`.
Теперь можно открывать  
`crontab -e`  
и добавлять строку в начало  
`MAILTO=i@sepa.spb.ru`  
Для получения ошибок в заданиях планировщика, и использовать `sendmail`/`mail()` в скриптах
