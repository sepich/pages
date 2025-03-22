---
title: ElasticSearch internals monitoring by Zabbix (v2 traps)
date: '2014-12-06T14:41:00.004+03:00'
tags:
- linux
- zabbix
modified: '2015-01-07T19:11:27.240+03:00'
thumbnail: /assets/img/2014/e1.png
url: /2014/12/elasticsearch-internals-monitoring-by.html
---
Here is more resource oriented version of ElasticSearch monitoring from [previous article](/2014/02/elasticsearch-internals-monitoring-by.html) with using zabbix-traps. Also, it comes with very basic template, which was so asked in comments:
![](/assets/img/2014/e1.png)

Graphs included:
- Shard's nodes status
- Indices tasks speed
- Indices tasks time spend

Installation:
1. Save this as `/etc/zabbix/zabbix_agentd.d/elasticsearch.conf`:
```bash
#Key jvm.uptime_in_millis used to trigger trap sending
UserParameter=es[*],/etc/zabbix/elasticsearch.py $1
```
1. And here is the data-getter:  
[/etc/zabbix/elasticsearch.py](https://github.com/sepich/zabbix/raw/master/elasticsearch.py)
{ target="_blank" }
2. Then import template:
[template_app_elasticsearch.xml](https://github.com/sepich/zabbix/raw/master/templates/template_app_elasticsearch.xml)
{ target="_blank" }

How to add a new counter:
- Browse JSON output of your server's:
`curl http://localhost:9200/_nodes/_local/stats?all=true`
- Write path to value of interest using dot as separator, for example:  
`indices.docs.count`
- Create new counter in zabbix with:   
`key name = es[path.you.found]`  
and `type = zabbix_trap`
- And here is the difference from [previous version](/2014/02/elasticsearch-internals-monitoring-by.html):   
Please note that you also need to add this path to counter to traps2 section of `elasticsearch.py` file. Then execute `elasticsearch.py` without any parameters and debug of `zabbix_sender` should be written to console. In top section you should find your new counter key (if it isn't - key is not found or empty in JSON output), and in bottom section number of failed items should be zero (if it isn't - there is no such key for this server configured in zabbix web)
