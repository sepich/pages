---
title: 'putty-nd vs SuperPuTTY '
date: '2014-09-28T15:34:00.000+04:00'
tags:
- linux
modified: '2014-10-02T22:49:01.687+04:00'
thumbnail: /assets/img/2014/opensess.png
url: /2014/09/putty-nd-vs-superputty.html
---
I've been using [putty-nd](http://sourceforge.net/projects/putty-nd/) for a long time. Starting from `putty_nd2.0` it  supports chrome-like tabs and development was going quite rapidly. [Lu Dong](mailto:noodle1983@126.com) (author) was always responding to emails and bugs were fixed fast. 

But unfortunately this stopped at Feb 2014 with few annoying bugs left:
- When some tab connection drops, it can randomly freeze some other tab, so you need to reconnect both of them
- Tab names are right aligned. So, when you have a lot of tabs opened, their width is short and you see only endings of names like `...ain.local` instead of `server1.doma..`
- When you click `open new session` button and starting to type search query - it always skips first letter
- And the most unfortunate was that putty-nd sources weren't available. Latest one I was able to find was [v6.0_nd1.11](http://sourceforge.net/p/putty-nd/code/commit_browser) back from 2011.

Nevertheless of those issues I still was using putty-nd. Because other clients like [MobaXterm](http://mobaxterm.mobatek.net/), [Xshell](http://www.netsarang.com/products/xsh_overview.html), [MTPuTTY](http://ttyplus.com/multi-tabbed-putty/), [mRemoteNG](http://www.mremoteng.org/) were even more inconvenient.   
Here is what I liked in putty-nd so much:
1. When there are >1000 sessions configured - you will never click by mouse in tree-like menu to open a new session. Preferably to have quick live search bind to hotkey
1. Having only hostname in clipboard and no such session configured, open new one based on some predefined settings in couple of keypress
1. When session was dropped, restart it without touching mouse (like pressing Enter in it)

[SuperPuTTY](https://code.google.com/p/superputty/) has almost 2 bullets from 3 above. And most importantly it is opensource. So, next time I got mad from `putty-nd` frozen tabs I'd decided to move to `SuperPuTTY`. A little patching and it became a usable client for me ;)

Here is what was done:
1. Open Session dialog  
![](/assets/img/2014/opensess.png)
{ .right }
Now search field always stay focused, pressing Up/Down you changing selection in table. Second column shows only folder name of session in tree. To search for all sessions in some folder start searching with `/` (as in example). Searching for hostname was changed to be matched from beginning, to search for any part of hostname - prepend search with `%`.
For example to find connection `i.sepa.spb.ru` from screenshot, one could search for `%sepa`

2. Added detection of dropped connection. For such tabs icon will be changed (to icon from putty-nd ;)  
   ![](/assets/img/2014/tabs.png)
{ .right }
For those first two tabs context menu will be also reduced. When you switch to such tab and press Enter in console, session will try to reconnect.

For other changes see commit history: [github.com/sepich/superputty/commits/master](https://github.com/sepich/superputty/commits/master)
  
Download precompiled binaries here: [github.com/sepich/superputty/releases](https://github.com/sepich/superputty/releases)

Main [patches](https://code.google.com/p/superputty/issues/detail?id=466) [were](https://code.google.com/p/superputty/issues/detail?id=465) [submitted](https://code.google.com/p/superputty/issues/detail?id=464) back to SuperPuTTY community - hope some of them would be merged upstream.
