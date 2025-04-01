---
title: ElasticSearch internals monitoring by Zabbix
date: '2014-02-15T16:02:00.000+04:00'
tags:
- linux
- zabbix
modified: '2014-12-06T14:44:50.890+03:00'
thumbnail: /assets/img/2014/es2.png
url: /2014/02/elasticsearch-internals-monitoring-by.html
---
> NOTE: New version of this article with use of zabbix_traps is [here](/2014/12/elasticsearch-internals-monitoring-by.html)

There are quite a lot of Zabbix monitoring agent extensions for ElasticSearch monitoring. But they are limited and provide just some predefined counters. What if you need to collect internal data?
![](/assets/img/2014/es2.png)

This in-detail data is displayed in ElasticSearch management interface, and provided in JSON by backend. You can preview it using any browser, just open:
[http://servername:9200/_cluster/nodes/stats?all=true](http://servername:9200/_cluster/nodes/stats?all=true)

Here is JSON browser from Firefox's Firebug:
![](/assets/img/2014/firebug.png)
As you can see, there are indeed a lot of internal detailed counters. It's easy now to write Zabbix agent extension, to load JSON url, parse it, get needed counter and provide to Zabbix. Just a little issue here - if you need to check 70 different counters, then page will be downloaded 70 times. So, let's do some caching of downloaded data for 30sec in tmpfs then.

Save this as `/etc/zabbix/elasticsearch.py`: 
```python
#!/usr/bin/env python

import urllib
import json
import sys, os, time

def main():
    # Usage: %s [url] path.counter.name
    # [url] ='all' by default
    urls = { 'all'    : "http://localhost:9200/_cluster/nodes/stats?all=true",
             'health' : "http://localhost:9200/_cluster/health" }
    if len(sys.argv) < 2:
      sys.exit('Usage: %s [url] path.counter.name' % sys.argv[0])

    # parse command line
    if len(sys.argv) > 2 and sys.argv[1] in urls:
      ty  = sys.argv[1]
      url = urls[ty]
      cnt = sys.argv[2]
    else:
      ty  = 'all'
      url = urls[ty]
      cnt = sys.argv[1]

    # download url with caching
    tmp = '/tmp/es_stats_'+ty
    try:
      if os.path.isfile(tmp) and (os.path.getmtime(tmp) + 30) > time.time():
        f = file(tmp,'r')
        body = json.load(f)
        f.close()
      else:
        f = urllib.urlopen(url)
        body = f.read()
        f = file(tmp,'w')
        f.write(body)
        f.close()
        body = json.loads(body)

    except:
      out = '0'

    else:
      # get results for current node from cluster results
      if ty == 'all':
        for node_id in body['nodes'].keys():
          if body['nodes'][node_id]['name'] == os.uname()[1]:
            stats = body['nodes'][node_id]
      else:
        stats = body

      # JVM counters calculations
      if cnt == 'jvm_heap_p_of_RAM':
        out = str(100*float(stats['jvm']['mem']['heap_committed_in_bytes'])/(stats['os']['mem']['actual_used_in_bytes'] + stats['os']['mem']['actual_free_in_bytes']))
      elif cnt == 'jvm_p_heap_used':
        out = str(100*float(stats['jvm']['mem']['heap_used_in_bytes'])/stats['jvm']['mem']['heap_committed_in_bytes'])

      # direct value
      else:
        c=cnt.split('.')
        while len(c):
          stats=stats[c.pop(0)]
        out = str(stats)

    print out

if __name__ == "__main__":
    main()
```

And create extension for agent `/etc/zabbix/zabbix_agentd.d/elasticsearch.conf`:
```bash
# Key syntax is es.json[page, counter].
# Page = "all" or "health". Default is "all", optional
# Counter is json path to counter value like indices.search.query_total and is mandatory
UserParameter=es.json[*],/etc/zabbix/elasticsearch.py $1 $2
```

Some preparations:
```bash
chmod +x /etc/zabbix/elasticsearch.py
/etc/init.d/zabbix-agent restart
```

And we are good to go, just provide JSON path to any counter needed divided by dot (.)
![](/assets/img/2014/zbcnt.png)

Also, there are some additional JVM online calculated counters provided by script:
![](/assets/img/2014/jvm.png)

With such result:
![](/assets/img/2014/es1.png)

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-03-27T19:12:02.184+04:00">19:12, 27 March 2014</time>:<br/>
Do you have a zabbix template also ?</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-07-29T10:13:27.080+04:00">10:13, 29 July 2014</time>:<br/>
Great script!  FYI, your script assumes that your node name matches your host name, in our environment it does not and I was getting the following error:<br /><br />Traceback (most recent call last):<br />  File &quot;/etc/zabbix/bin/elasticsearch.py&quot;, line 68, in <br />    main()<br />  File &quot;/etc/zabbix/bin/elasticsearch.py&quot;, line 62, in main<br />    stats = stats[c.pop(0)]<br />UnboundLocalError: local variable &#39;stats&#39; referenced before assignment<br /><br />I updated the line:<br />if body[&#39;nodes&#39;][node_id][&#39;name&#39;] == os.uname()[1]:<br />to<br />if body[&#39;nodes&#39;][node_id][&#39;hostname&#39;] == os.uname()[1]:<br /><br />so that it would work for me.  Thanks again!<br /></div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-08-14T13:38:13.369+04:00">13:38, 14 August 2014</time>:<br/>
Can you provide Zabbix template please? XML export of template that you use and have this graphs from?</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-09-18T18:04:42.969+04:00">18:04, 18 September 2014</time>:<br/>
great script can you alos export the xml &amp; post please ?</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-11-19T21:26:16.327+03:00">21:26, 19 November 2014</time>:<br/>
Can&#39;t generate data. Erro: &quot;Received value [] is not suitable for value type [Numeric (unsigned)] and data type [Decimal]</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2014-12-06T14:47:23.566+03:00">14:47, 06 December 2014</time>:<br/>
Thank you all for feedback, <br />I&#39;ve published new version of this script:<br />https://alex.ryabov.dev/2014/12/elasticsearch-internals-monitoring-by.html<br />Some bugs were fixed, basic template included.</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2014-12-30T15:18:16.173+03:00">15:18, 30 December 2014</time>:<br/>
where i need to setup this, on zabbix client or zabbix server  ?</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2014-12-31T00:08:19.351+03:00">00:08, 31 December 2014</time>:<br/>
It is client part.<br />For server part template see the new version of article:<br />https://alex.ryabov.dev/2014/12/elasticsearch-internals-monitoring-by.html</div>
<div class="comment"><img src="//www.blogger.com/img/blogger_logo_round_35.png"/><a href="https://www.blogger.com/profile/10545979198212825289">alpha_Qu4z4r</a> at <time datetime="2016-03-10T16:16:22.020+03:00">16:16, 10 March 2016</time>:<br/>
Can you export all of your code to github or another public VCS?</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2016-03-10T21:24:06.979+03:00">21:24, 10 March 2016</time>:<br/>
Have you carefully read the article? Especially the very first line ;)</div>
