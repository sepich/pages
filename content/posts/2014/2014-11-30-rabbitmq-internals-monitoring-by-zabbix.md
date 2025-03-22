---
title: RabbitMQ internals monitoring by Zabbix
date: '2014-11-30T18:15:00.000+03:00'
tags:
- linux
- zabbix
modified: '2015-03-02T22:53:44.407+03:00'
thumbnail: /assets/img/2014/r1.png
url: /2014/11/rabbitmq-internals-monitoring-by-zabbix.html
---
Continuation of extending zabbix-agent to monitor internals of applications. Now it's a RabbitMQ turn:
![](/assets/img/2014/r1.png)

What's supported:
- File descriptors, Memory, Sockets watermarks monitoring 
- Low level discovery of vhosts/queues
- Monitoring for messages, unack, consumers per queue
- Triggers for important counters
- Data sent in chunks, not one by one, using zabbix traps 

Installation:
1. Save this as `/etc/zabbix/zabbix_agentd.conf.d/rabbitmq.conf`:
```bash
# rabbitmq[server,uptime] will trigger trap sending
# run '/etc/zabbix/rabbitmq.py server uptime debug' - to debug trap sending
UserParameter=rabbitmq[*],/etc/zabbix/rabbitmq.py $1 $2
```
1. Which will call this data-getter:  
[/etc/zabbix/rabbitmq.py](https://github.com/sepich/zabbix/raw/master/rabbitmq.py)
{ target="_blank" }
1. Import template  
[template_app_rabbitmq.xml](https://github.com/sepich/zabbix/raw/master/templates/template_app_rabbitmq.xml)
{ target="_blank" } 


Notes:
- Queues statistic is per-cluster and not per-server. This mean that having cluster of three nodes, all of them will have equal graphs for queues. So, there is line 31 in rabbitmq.py which states:
```python
if not socket.gethostname().endswith("-1"): return []  #only discover queues on first node
```
We have naming convention like `node-1`, `node-2` - and discovering queues only on first node. Remove/modify this line if it is not your case
- Data about queues is sent as zabbix traps to lower bandwidth and system load.  
To troubleshoot `zabbix_sender` run script manually as:
```bash
`/etc/zabbix/rabbitmq.py server uptime debug
```
