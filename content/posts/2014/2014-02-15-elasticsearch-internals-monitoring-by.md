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
