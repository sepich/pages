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
1. Import template  
[template_app_rabbitmq.xml](https://github.com/sepich/zabbix/raw/master/templates/template_app_rabbitmq.xml)

Notes:
- Queues statistic is per-cluster and not per-server. This mean that having cluster of three nodes, all of them will have equal graphs for queues. So, there is line 31 in rabbitmq.py which states:
```python
if not socket.gethostname().endswith("-1"): return []  #only discover queues on first node
```
We have naming convention like `node-1`, `node-2` - and discovering queues only on first node. Remove/modify this line if it is not your case
- Data about queues is sent as zabbix traps to lower bandwidth and system load.  
To troubleshoot `zabbix_sender` run script manually as:
```bash
/etc/zabbix/rabbitmq.py server uptime debug
```

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2015-03-02T18:02:48.075+03:00">18:02, 02 March 2015</time>:<br/>
&gt;Which will call this data-getter<br />/etc/zabbix/rabbitmq.py<br />Link is leading to https://github.com/sepich/zabbix/raw/master/elasticsearch.py<br />Thanks for your work by the way.</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2015-03-02T22:55:15.736+03:00">22:55, 02 March 2015</time>:<br/>
And thanks to you for pointing this out)<br />Fixed.</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2015-07-03T11:49:21.698+03:00">11:49, 03 July 2015</time>:<br/>
Hi! Your graph is very beautiful !!! :D<br />I want the same... :D i followed all your steps and from Zabbix frontend i get no data about RabbitMQ Server (Server Disk, File Desc, Sockets...) Could you please help?</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2015-07-03T16:01:26.306+03:00">16:01, 03 July 2015</time>:<br/>
It&#39;s fine now...config Zabbix agent (active)</div>
