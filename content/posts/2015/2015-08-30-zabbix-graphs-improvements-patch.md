---
title: Zabbix graphs improvements patch
date: '2015-08-30T13:51:00.001+03:00'
tags:
- art
- linux
- zabbix
modified: '2016-01-03T15:25:02.388+03:00'
thumbnail: /assets/img/2015/zb1.png
url: /2015/08/zabbix-graphs-improvements-patch.html
---

> Update: You'd better check out my [zabbixGrapher](/2016/08/zabbix-vs-graphs.html)

Here is the cumulative patch to fix some Zabbix graphs viewing issues. Ideas are not new, a lot of zabbix users complains on current out-of-the-box implementation:
- [ZBXNEXT-1120](https://support.zabbix.com/browse/ZBXNEXT-1120) - Enable viewing a graph for all hosts in a given group
- [ZBXNEXT-75](https://support.zabbix.com/browse/ZBXNEXT-75) - Add a "show all" option for viewing all graphs for a host on one page
- [ZBXNEXT-1262](https://support.zabbix.com/browse/ZBXNEXT-1262) - Nested host groups
- Minor graph appearance fix

Full patch is for Zabbix 2.4.3. You can open it on [github](https://github.com/sepich/zabbix/blob/master/patches/graphs.patch) and read below what each change do:

#### include/views/monitoring.charts.php (Javascript in the beginning)
  
This adds groups filter. Issue is when you have a lot of groups you'd become tired to scroll them. (We have hosts automatically registering to Zabbix and attached to group). For example in this case groups "EXRMF BC", "EXRMF CO", "EXRMF DC3" etc. are merged to one group "EXRMF >". When you select such group another select appears on the right side allowing to specify exact group.
![](/assets/img/2015/zb1.png)  
This only happens when user allowed to view more than 50 groups, tweak this line if you need to change it:
```php
if(jQuery('#groupid option').length>50){
```

#### include/views/monitoring.charts.php (the rest PHP code)
This implements both [ZBXNEXT-1120](https://support.zabbix.com/browse/ZBXNEXT-1120) and [ZBXNEXT-75](https://support.zabbix.com/browse/ZBXNEXT-75). So, now you can select host and do not specify graph to view all its graphs on one page. Or select graph to view and do not specify host (or even a group) to view this graph for multiple hosts.
![](/assets/img/2015/zb2.png)  
As it is possible to have a lot of graphs attached to one server, or a lot of servers having the same graph (eth0 traffic) - paging is used here. Tweak this line to determine how many graphs should be displayed per page:
```php
CWebUser::$data['rows_per_page'] = 20;
```
#### js/class.csuggest.js
This change is for search field. You start typing servers and got list of suggestions. Pressing Enter previously just selects server from list filling in search field. You have to press Search button to do action. Now action is done automatically.

#### include/defines.inc.php
This changing font to much smaller one `Calibri`. You can take .ttf from Windows and place to `/usr/share/zabbix/fonts/`

#### The rest of files
Minor changes for single graph appearance to make it more clean and simpler when multiple graphs are displayed on one page. Example of single graph after change:
![](/assets/img/2015/zb3.png)  
Also, you might want to set theme graph background to white. Unfortunately, I do not know how to do it from Web Interface, so here are DB queries:
```sql
update graph_theme set backgroundcolor='FFFFFF' where graphthemeid='1';
update graph_theme set graphbordercolor='FFFFFF' where graphthemeid='1';
```
This patch is not depends but meant to be applied after [ZBXNEXT-599](https://support.zabbix.com/browse/ZBXNEXT-599) "Logarithmic scale for Y-axis in graphs" like this:
```bash
wget https://support.zabbix.com/secure/attachment/35716/logarithmic-graphs-zabbix-2.4.5.patch
wget https://github.com/sepich/zabbix/raw/master/patches/graphs.patch
cd /usr/share/zabbix/
patch -p 1 -i ~/logarithmic-graphs-zabbix-2.4.5.patch
patch -p 1 -i ~/graphs.patch
```

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2015-09-17T18:33:25.960+03:00">18:33, 17 September 2015</time>:<br/>
This looks great, but unfortunately not working with 2.4.6 :(</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2015-11-20T19:26:44.905+03:00">19:26, 20 November 2015</time>:<br/>
How do you implement that?</div>
