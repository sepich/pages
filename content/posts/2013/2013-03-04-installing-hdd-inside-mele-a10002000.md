---
title: Installing HDD inside of Mele A1000/2000
date: '2013-03-04T10:16:00.000+04:00'
tags:
- linux
- mele
modified: '2014-02-14T22:56:03.587+04:00'
thumbnail: /assets/img/2013/IMG_20130228_202339.jpg
url: /2013/03/installing-hdd-inside-mele-a10002000.html
---
I have a Mele A2000G and use it as home media server (with Debian installed instead of Android). And HDD is the main thing of this set. But i don't have an HDD case (I heard that it goes with A1000 model) And it looks not so accurate to place this box near a TV with a raw HDD without cover installed on top of it. Let's check if it possible to install HDD right inside the Mele A2000 box:  
![](/assets/img/2013/IMG_20130228_202339.jpg)
On top is Mele A2000G inside.  
I just place 2,5" HDD on top of the main board to check if there is place for it. Looks good.   
![](/assets/img/2013/IMG_20130228_214447.jpg)
But we need to get rid of this SATA connector board attached to plastic cover, and make a top surface of cover flat inside. We will attach HDD directly to mainboard. There is no problem with SATA-data cable and sockets, they are standard. Question is SATA-power cord. There is standard for SATA 15 pin Power Connector Pinout (ATX v2.2):

|Pin|Name|Color|Description|
|:--|:---|:----|:----------|
|1|+3.3VDC|Orange|+3.3 VDC|
|2|+3.3VDC|Orange|+3.3 VDC|
|3|+3.3VDC|Orange|+3.3 VDC|
|4|COM|Black|Ground|
|5|COM|Black|Ground|
|6|COM|Black|Ground|
|7|+5VDC|Red|+5 VDC|
|8|+5VDC|Red|+5 VDC|
|9|+5VDC|Red|+5 VDC|
|10|COM|Black|Ground|
|11|COM|Black|Ground (Optional or other use)|
|12|COM|Black|Ground|
|13|+12VDC|Yellow|+12 VDC|
|14|+12VDC|Yellow|+12 VDC|
|15|+12VDC|Yellow|+12 VDC|
  
But there is only 2-wired cable for SATA-power socket and a couple of resistors on a SATA connector board. If you look close at SATA-power soldering at connector board you'll see that pins 1-3 and 13-14 aren't even soldered. I've checked this by voltmeter and that's true - only voltage left is +5V. Ok, we'll need standard SATA-power cable. I've even removed unneeded yellow and orange wires from the connector:  
![](/assets/img/2013/IMG_20130228_203916.jpg)
Then I've cut Mele's "SATA-power" cord and solder to standard cord preserving polarity (then isolated it):   
![](/assets/img/2013/IMG_20130228_205016.jpg)
Before cutting top plastic cover it's need to remove antenna. It's just glued by a scotch tape. I've used a knife to remove it.  
![](/assets/img/2013/IMG_20130228_205856.jpg)
This is a removed antenna and a couple of heat-sinks i've found in my table. Cause installed HDD will prevent good ventilation inside of case, I think that some heat-sinks will not harm.   
![](/assets/img/2013/IMG_20130228_210213.jpg)
Go and cut the plastic case. No way back!)  
![](/assets/img/2013/IMG_20130228_211836.jpg)
If you'll look close to this plastic bay door, there are pins witch hold it in place. Right pins are shorter than left, so when install or remove it - just bend and take pull out right side first:  
![](/assets/img/2013/IMG_20130228_213153.jpg)
Cover cutting completed) Make sure to not damage those little plastic hollow, which holds plastic door's stopper:  
![](/assets/img/2013/IMG_20130228_213500.jpg)
Fixing HDD in place. I've used foam rubber and 2-sided scotch. Glue the antenna back to front side of the cover.  
![](/assets/img/2013/IMG_20130228_214511.jpg)
Operation is completed. Its even possible to open this door a little, to increase the air flow)  
![](/assets/img/2013/IMG_20130228_220040.jpg)
Then power on and check that HDD is still working:  
![](/assets/img/2013/Clipboard01.gif)

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2013-03-24T23:32:20.606+04:00">23:32, 24 March 2013</time>:<br/>А как туда Debian поставить???</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2013-03-25T18:26:49.730+04:00">18:26, 25 March 2013</time>:<br/>
Вначале поставить на карту<br /><a href="http://linux-sunxi.org/Bootable_OS_images" rel="nofollow">http://linux-sunxi.org/Bootable_OS_images</a><br />А потом перенести в NAND, если надо, например с помощью <a href="http://guillaumeplayground.net/pimp-my-mele/" rel="nofollow">PIMP_MY_MELE</a></div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2013-06-21T02:12:15.153+04:00">02:12, 21 June 2013</time>:<br/>
Похоже здесь единственная во всем интернете фотография варианта платы с четырьмя микросхемами памяти. Вот мне тоже такая досталась. Главный вопрос: на каком разъеме у нее UART и какая распиновка? На известной странице про &quot;hacking mele&quot; изображены не такие варианты платы. А убить устройство неправильным подключением очень бы не хотелось - 5 тыс посредникам платил и два месяца ждал.</div>
