---
title: Display computer name for logged on user in AD Users and Computers
date: '2011-08-03T15:25:00.005+04:00'
tags:
- windows
modified: '2011-09-25T09:46:52.337+04:00'
thumbnail: /assets/img/2011/cname1.png
url: /2011/08/display-computer-name-for-logged-on.html
---
Описание как можно сделать следующее:  
![](/assets/img/2011/cname1.png)  
Т.е. для учетных записей пользователей отображается имя компьютера, на который они вошли (или последний с которого вышли), а для учетных записей компьютера отображается имя пользователя который на них вошел (или последний вышедший). Для этого необходимо будет добавить VBS logon/logoff скрипт пользователям, который будет редактировать атрибут carLicense в AD для учеток компа и юзера. Добавить права пользователю на редактирование своего атрибута carLicense, и всем пользователям на редактирование атрибута carLicense у всех компьютеров.  А так же добавить отображение колонки с нашим атрибутом в оснастку **AD Users and Computers**.  

Краткая инструкция:
1. Открываем **AD Users and Computers** и на OU содержащем ваших юзеров и компы нажимаем правой кнопкой и запускаем **Delegate Wizard**.  
   - На первом экране нажимаем **Далее**
   - На следующем выбираем группу SELF
     ![](/assets/img/2011/cname2.png)
   - Далее выбираем **Создать особую задачу для делегирования**, которую применяем только к следующим объектам в этой папке - **пользователь**
     ![](/assets/img/2011/cname3.png)
   - Далее выбираем разрешения для записи атрибута **carLicense**
     ![](/assets/img/2011/cname4.png)
1. Точно так же назначаем для группы **пользователи домена** (или более мелкой группы ваших пользователей) права для **Компьютер объектов** на запись его атрибута **carLicense**.
1. Для добавления колонок в оснастку **AD Users and Computers** запускаем **adsiedit.msc**. Переходим в конфигурацию   
`CN=default-Display,CN=409,CN=DisplaySpecifiers,CN=Configuration,DC=example,DC=org`  
В зависимости от языка системы выбирайте `409` - en, `419` - rus. Изменения конфигурации затронит все оснастки на всех компьютерах. Раскрываем параметр **extraColumns** и добавляем строку   
```
carLicense,Use,1,130,0
```
Поля, разделенные запятыми, означают:  
  - имя поля AD
  - заголовок колонки
  - 1=отображать по умолчанию 0=нет
  - ширина -1=автоподбор ширины по заголовку колонки
  - 0=неизвестный параметр ;)
1. Таким образом мы добавили колонку к просмотру **AD U&C** в режиме запросов. Если же необходимо добавить колонку к режиму просмотра OU, а так же OU Users и OU Computers (которые являются специальными контейнерами) - то необходимо так же отредактировать параметр **extraColumns** в конфигурациях:
```
CN=container-Display,CN=409,CN=DisplaySpecifiers,CN=Configuration,DC=example,DC=org ;  
CN=organizationalUnit-Display,CN=409,CN=DisplaySpecifiers,CN=Configuration,DC=example,DC=org
```
Обратите внимание что параметра **extraColumns** там может и не быть, или он может быть пустой. И как только вы добавите в него строку, при добавлении колонок вы сможете выбирать только из списка который вы добавили в параметр - т.е. из одной колонки. Поэтому я так же добавляю колонку  
```
whenChanged,Modify,1,130,0
```
Чтобы иметь колонку с датой изменений (редактирования объекта, или последнего входа/выхода)   
1. Назначаем через GPO следующие vbs скрипты юзерам.  
На logon:   
```vb
Dim adsinfo, ThisComp, oUser
' Определяем объекты
Set adsinfo = CreateObject("adsysteminfo")
Set ThisComp = GetObject("LDAP://" & adsinfo.ComputerName)
Set oUser = GetObject("LDAP://" & adsinfo.UserName)
' Заносим данные в AD
' В поле CarLicense компьютера пишем фамилию, имя пользователя и знак входа
Thiscomp.put "CarLicense", oUser.sn + " " + oUser.givenName + " >"'+  CStr(Now)
ThisComp.Setinfo
'В поле CarLicense учетки пользователя пишем имя компьютера и знак входа
oUser.put "CarLicense", ThisComp.cn + " <"'+  CStr(Now)
oUser.Setinfo
wscript.quit
```
И на logoff:   
```vb
Dim adsinfo, ThisComp, oUser
' Определяем объекты
Set adsinfo = CreateObject("adsysteminfo")
Set ThisComp = GetObject("LDAP://" & adsinfo.ComputerName)
Set oUser = GetObject("LDAP://" & adsinfo.UserName)
' Заносим данные в AD
' В поле CarLicense компьютера пишем фамилию,имя пользователя и знак выхода
Thiscomp.put "CarLicense", oUser.sn + " " + oUser.givenName + " >"'+  CStr(Now)
ThisComp.Setinfo
'В поле CarLicense пользователя пишем имя компьютера и знак выхода
oUser.put "CarLicense", ThisComp.cn + " >" '+ CStr(Now)
oUser.Setinfo
wscript.quit
```
1. Для проверки можно попробовать запустить logon скрипт с правами пользователя, он не должен выдавать ошибок, а в оснастке **AD Users and Computers** при обновлении должна появиться необходимая информация.
