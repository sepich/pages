---
title: Punto Switcher msi for GPO deployment
date: '2011-09-13T09:44:00.002+04:00'
tags:
- windows
- msi
modified: '2011-09-16T22:38:53.330+04:00'
thumbnail: /assets/img/2011/punto.png
url: /2011/09/punto-switcher-msi-for-gpo-deployment.html
---
![](/assets/img/2011/punto.png)
{ .right }
Сборка **Punto Switcher** 3.2.5 в пакет **msi** для установки в домене. 

Изменения:
- Удален yandex update
- При установке пытается удалить другие версии PuntoSwitcher вместе с настойками, и ярлыки в меню Пуск
- Настройки сохраняются в папке с программой в `User Data` для всех локальных юзеров. При установке даются права записи на эту папку для юзеров.
- Настройки по умолчанию: автопереключение выкл., звуки выкл, <kbd>Win</kbd>+<kbd>S</kbd> убран, добавлен <kbd>Shift</kbd>+<kbd>ScrollLock</kbd> для истории буфера обмена.
- В исключения программ добавлен IrfanView

[Download Punto Switcher msi](http://ge.tt/9CnWhh7?c) 
[How to](/2011/09/howto-cook-custom-firefox-msi-for-enterprise-deployment) do it yourself
