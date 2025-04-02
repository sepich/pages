---
title: Speed up Zabbix Graphs with Nginx caching
date: '2016-01-03T15:20:00.001+03:00'
tags:
- nginx
- zabbix
modified: '2016-01-03T15:22:01.739+03:00'
thumbnail: /assets/img/2016/xkey.png
url: /2016/01/speed-up-zabbix-graphs-with-nginx.html
---
After installing [zabbixGrapher](/2016/08/zabbix-vs-graphs) or implementing [Zabbix graphs improvements patch](/2015/08/zabbix-graphs-improvements-patch.html) you might face with an issue of slow image loading on graphs page which contains 24  pics at once. And this problem could get worse depending on how much online users you have in Zabbix. In our case solution was to cache images for 1 minute, as we have usual Item `interval=60sec`. This will help when multiple users looking at the Graphs for same Host (happens when it appears in Monitoring). Also, by default Users in Zabbix have setting to update graphs each 30sec, so caching for 60sec would reduce load twice.
This is how usual URL to graph image looks:
```php
chart2.php?graphid=62014&screenid=1&width=600&height=200&legend=1&updateProfile=1&profileIdx=web.screens&profileIdx2=62014&period=604800&stime=20161226030400&sid=f3df43d8c3f401ec
```

Nginx cache is fast key-value store, so we need to decide on string Key based on URL to uniquely identify each image. 
- First issue is that same parameters in URL could be at any place, thus making different string Keys pointing to the same image. So, we need to always store parameters in the same order in the Key.
- Another thing is that we do not need all the parameters. For example for different users `sid` would have different values, but we want to show same image from cache to all the users.

This will leave us with such stripped down URL:
```php
chart2.php?period=604800&stime=20161226030400&width=600&height=200&graphid=62014
```

For [ad-hoc graphs](https://www.zabbix.com/documentation/2.4/manual/config/visualisation/graphs/adhoc) URL would contain two more parameters and point to chart.php:
```php
chart.php?period=604800&stime=20161226030400&width=600&height=200&type=0&itemids%5B0%5D=34843&itemids%5B1%5D=34844&itemids%5B2%5D=34845
````

And here is resulting nginx configuration for such case:
```nginx
fastcgi_cache_path /tmp/cache levels=1:2 keys_zone=cache:10m max_size=1G;
upstream fpm {
  server unix:/var/run/php5-fpm.sock;
  server another.fpm.servers:9000;
}
server {
  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/var/run/php5-fpm.sock;

    location ~ chart2?\.php {
      fastcgi_pass fpm;

      if ($request_uri ~ (period=[0-9]+)) { set $period $1; }
      if ($request_uri ~ (stime=[0-9]+)) { set $stime $1; }
      if ($request_uri ~ (width=[0-9]+)) { set $width $1; }
      if ($request_uri ~ (height=[0-9]+)) { set $height $1; }
      if ($request_uri ~ (graphid=[0-9]+)) { set $graphid $1; }
      if ($request_uri ~ (itemids.*?)&(?!itemids)) { set $itemids $1; }
      if ($request_uri ~ (type=[0-9]+)) { set $type $1; }

      expires 2m;
      set $xkey $period$stime$width$height$graphid$type$itemids;
      add_header "X-key" $xkey;
      fastcgi_cache_key  $xkey;
      fastcgi_ignore_headers Cache-Control Expires Set-Cookie;
      fastcgi_cache cache;
      fastcgi_cache_valid 2m;
      fastcgi_cache_lock on;
    }
  }
}
```
Main thing is in location `chart2?\.php` which is regex corresponding to both `chart2.php` and `chart.php`. We strip `$request_uri` to parts we care of, and setting variables to values of those parts.  
Then we collect all variables in predefined order, to make consistent Key for same image, this will be stored in `$xkey` variable.  
Then we also adding custom header `X-key` for debugging. It is shown in server response:
![](/assets/img/2016/xkey.png)  
We also setting `Expires` to 2 minutes, and ignoring all `Cache-Control` headers sent by php (as they are disabling client-side caching by setting `Expires` to year ago)

There is no need to cache graphs for more than 2min, as each image has `start time` and `period`. Thus having Key updated each minute, we do not need to store old outdated pics for longer time.

Cache should be working now, you should see folder `/tmp/cache` increasing in size. But there is no any speedup of page load at all. Having page with all pics loaded you press <kbd>F5</kbd> and they do load slowly again. But you've expected they would be quickly loaded from cache as minute is not passed yet. Answer is javascript Zoom Timeline, which generates images url based on current time in second. So, each time you refresh the page - stime=201612260304`23` value is also changing. As we do not want to show each second images, and only want to show per-minute ones - we also need to fix js to floor values like 201612260304`23` to 201612260304`00`. This is done in `gtlc.js`:
```diff
+++ ./js/gtlc.js        2015-11-22 13:11:02.306277281 -0800
@@ -181,6 +182,8 @@
                        period = this.timeline.period(),
                        stime = new CDate((this.timeline.usertime() - this.timeline.period()) * 1000).getZBXDate();

+                       stime = stime - stime % 60;
+
                // image
                var imgUrl = new Curl(obj.src);
                imgUrl.setArgument('period', period);
```
If you are also using [Zabbix graphs improvements patch](/2015/08/zabbix-graphs-improvements-patch.html) - you might also want to fix generating php side too:
```diff
+++ ./include/classes/screens/CScreenGraph.php  2015-11-22 13:02:29.014493480 -0800
@@ -161,7 +161,7 @@
                                .'&height='.$this->screenitem['height'].'&legend='.$legend.$this->getProfileUrlParams();
                        $timeControlData['src'] .= ($this->mode == SCREEN_MODE_EDIT)
                                ? '&period=3600&stime='.date(TIMESTAMP_FORMAT, time())
-                               : '&period='.$this->timeline['period'].'&stime='.$this->timeline['stimeNow'];
+                               : '&period='.$this->timeline['period'].'&stime='.($this->timeline['stimeNow'] - $this->timeline['stimeNow'] % 100);
                }

                // output
```
Check `zabbixGrapher` again by moving through pages back and forth, or selecting and deselecting the same Host, and images should appear immediately.

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2018-03-19T01:29:26.652+03:00">01:29, 19 March 2018</time>:<br/>Hello, I do think your blog may be having browser compatibility <br />issues. Whenever I take a look at your site in Safari,<br />it looks fine however when opening in IE, it&#39;s <br />got some overlapping issues. I simply wanted <br />to give you a quick heads up! Apart from that, fantastic blog!</div>
