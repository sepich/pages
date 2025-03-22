---
title: Custom context commands in AD Users and Computers
date: '2011-08-05T09:12:00.002+04:00'
tags:
- windows
modified: '2011-09-25T09:48:31.864+04:00'
thumbnail: /assets/img/2011/ccom1.png
url: /2011/08/custom-context-commands-in-ad-users-and.html
---
Можно добавить свои комманды в меню по правой кнопке мышки для консольки **AD Users and Computers**:  
![](/assets/img/2011/ccom1.png)

В примере покажу Ping для Компьютеров и Unlock для Пользователей:
1. Открываем **adsiedit.msc** и переходим в раздел:  
`CN=user-Display,CN=409,CN=DisplaySpecifiers,CN=Configuration,DC=domain,DC=ru`
Здесь `409` - для английского языка системы, `419` - для русского.   
Часть domain.ru - конечно тоже у всех своя)
1. Дважды кликаем на **user-Display** а затем на **adminContextMenu**
   ![](/assets/img/2011/ccom2.png)
1. Добавляем   
`4,Unlock,c:\Windows\SYSVOL\sysvol\domain.ru\scripts\unlockUser.vbs`  
здесь поля разделенные запятыми:  
- номер сверху, под которым пункт будет отображаться в меню  
- название пункта, можно использовать & для указания hotkey  
- путь к скрипту, можно указывать и UNC  

1. Открываем такой же атрибут для параметра:  
`CN=computer-Display,CN=409,CN=DisplaySpecifiers,CN=Configuration,DC=domain,DC=ru`
и добавляем:  
`5,Ping,c:\Windows\SYSVOL\sysvol\domain.ru\scripts\ping.cmd`
1. Теперь дело за самими скриптами. Здесь для примера используется обработка параметров вызова для vbs и cmd. Путь по которому лежат скрипты реплицируется на все контроллеры домена, а вот если вы будете открывать консоль ADUC с локального компа, например через RSAT, то скрипты обнаружены не будут. Если вам необходимо такое использование, то можно положить скрипты в шару, или в  
`\\domain.ru\sysvol\domain.ru\scripts\`
Но  тогда при каждом запуске вы будете получать сообщение  
![](/assets/img/2011/ccom3.png)  
Которое я не смог побороть (
1. Сохраняем скрипт `unlockUser.vbs`:
```vb
   Const E_ADS_PROPERTY_NOT_FOUND = -2147463155
   
   Set wshArguments = WScript.Arguments
   Set objUser = GetObject(wshArguments(0))
   
   If IsLockedOut(objUser) Then
     objUser.Put "lockouttime","0"
     objUser.SetInfo
     MsgBox "The user has been unlocked - " & objUser.sAMAccountName
   Else
     MsgBox "The user account is not locked - " & objUser.sAMAccountName
   End If
   
   Function IsLockedOut(objUser)
      on Error resume next
      Set objLockout = objUser.get("lockouttime")
      
      if Err.Number = E_ADS_PROPERTY_NOT_FOUND then
         IsLockedOut = False
         Exit Function
      End If
      On Error GoTo 0
      
      if objLockout.lowpart = 0 And objLockout.highpart = 0 Then
         IsLockedOut = False
      Else
         IsLockedOut = True
      End If
   End Function
```
1. Сохраняем скрипт `ping.cmd`:  
```
ping %2 -t
```
(будет идти бесконечный пинг, закрытие окна по Ctrl-C)
1. Открываем консоль ADUC и проверяем :)  
