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
There is [jailbreak](http://www.mobileread.com/forums/showthread.php?t=160454)
{ target="_blank" } already, but no any lanscape hack yet unfortunately. That would be very useful for reading pdf. So, if there is no way to make it directly on Kindle, we will make it for Kindle)  
I'm use [k2pdfopt](http://www.willus.com/k2pdfopt/)
{ target="_blank" } like this:  
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
- <b>-h 711-w 521</b> - width and height of screen zone for displaying pdf. There is [table](https://docs.google.com/spreadsheet/ccc?key=0Amk6MWy_gPlzdHU4NmlVVDhOZnZ2WVlJNlRHWkcyenc&hl=en_US)
{ target="_blank" } for other readers.
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
