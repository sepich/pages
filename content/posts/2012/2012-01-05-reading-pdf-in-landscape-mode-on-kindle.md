---
title: Reading PDF in landscape mode on Kindle Touch
date: '2012-01-05T13:14:00.000+04:00'
tags:
- art
modified: '2012-01-05T13:14:06.845+04:00'
thumbnail: /assets/img/2012/kindle1.jpg
url: /2012/01/reading-pdf-in-landscape-mode-on-kindle.html
---
Current version of firmware for Kindle Touch lacks support of landscape mode. WTF!   
There is [jailbreak](http://www.mobileread.com/forums/showthread.php?t=160454) already, but no any lanscape hack yet unfortunately. That would be very useful for reading pdf. So, if there is no way to make it directly on Kindle, we will make it for Kindle)  
I'm use [k2pdfopt](http://www.willus.com/k2pdfopt/) like this:  
```bash
k2pdfopt.exe -col 1 -j 0+ -ls -ui -fc- -odpi 130 -h 711 -w 521 -om 0 -cmax 1 -s- -rt 0 -mb 0.7 %1  
```
  
Let's look at them in detail:  

- <b>-col 1</b> - means that there is no need to find any columns in text. If you have tables, this will helps to not break them to columns at new pages
- <b>-j 0+</b> - tries to justification text left
- <b>-ls</b> - rotate page to landscape
- <b>-ui </b>- run UI for making additional tuning before converting
- <b>-fc</b> - don't fit columns to width
- <b>-odpi 130</b> - slightly zooming of input file
- <b>-h 711-w 521</b> - width and height of screen zone for displaying pdf. There is [table](https://docs.google.com/spreadsheet/ccc?key=0Amk6MWy_gPlzdHU4NmlVVDhOZnZ2WVlJNlRHWkcyenc&hl=en_US) for other readers.
- <b>-om 0</b> -disable output margin, Kindle Touch already has margin about 10px near pdf displaying zone
- <b>-cmax 1 -s-</b> - disable increasing of contrast and sharpening. This makes fonts looks more like ClearType, with soft edges.
- <b>-rt 0</b> - disable auto determination of source orientation
- <b>-mb 0.7</b> - cut bottom margin of source in inches. This is for cutting original footer with page number etc on every source page.
- <b>%1</b> - name of source pdf

You can save this as `.cmd` file, and drag'n'drop your pdf files over.  
Examples of source:  
![](/assets/img/2012/kindle1.jpg)
{ height="250px" }   
and 2 pages of zoomed output:  
![](/assets/img/2012/kindle2.jpg)
{ width="250px" }  

Comments imported from blogger:
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3idK5UVHvOzaWfqpJL6UqLf0ia8iKbSmrAmR6kGqw3PnwOeLaYvR41tXzDnVw3-zVZC9pNfCExb_D4PuP4pHR0L1G91i7Bf-4FMtzxK8ZuhtjsfP_5VIH2b-Z9YNnDw/s220/Sad+Ballon+Painting.jpg"/><a href="https://www.blogger.com/profile/06052975063371482491">blurred</a> at <time datetime="2012-08-20T23:11:45.941+04:00">23:11, 20 August 2012</time>:<br/>
that&#39;s great dear...love it...</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2012-09-02T01:52:10.384+04:00">01:52, 02 September 2012</time>:<br/>
Thanks you for sharing your options for this wonderful program. By the way, in my case I get better result with dpi200. But I guess it&#39;s depend on original pdf file.<br />p.s. Sorry for my English, it&#39;s not my native language.</div>
<div class="comment"><img src="//www.blogger.com/img/blogger_logo_round_35.png"/><a href="https://www.blogger.com/profile/14404650622167926856">emathimata team</a> at <time datetime="2013-04-14T00:34:07.329+04:00">00:34, 14 April 2013</time>:<br/>
Thanks for your help!</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-03-11T20:29:40.398+04:00">20:29, 11 March 2014</time>:<br/>
Please restore document under link table. It was very useful and seems there is no such information anywhere else.</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2014-03-11T20:38:46.249+04:00">20:38, 11 March 2014</time>:<br/>
Which exact document you are talking about? Both links in article are still working.</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-03-11T20:50:05.607+04:00">20:50, 11 March 2014</time>:<br/>
..There is &#39;table&#39; for other readers... I cant check it right now, cause it require google pass. But last time i try there was nothing or error, something like that. But if you say its okay, I&#39;ll try again. TIA</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2014-03-11T20:56:36.500+04:00">20:56, 11 March 2014</time>:<br/>
Confirmed, looks like owner of original Google doc has deleted the file. Unfortunately I cannot restore it.<br />But it is not an issue, because there is KOReader with wonderfull pdf support:<br />https://github.com/koreader/koreader</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-03-11T21:53:21.274+04:00">21:53, 11 March 2014</time>:<br/>
Thank you for this link. It seems to be interest info.</div>
