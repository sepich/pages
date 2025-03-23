---
title: Network socket state statistics monitoring by Zabbix
date: '2014-11-29T12:29:00.000+03:00'
tags:
- linux
- zabbix
modified: '2016-07-20T22:48:16.763+03:00'
thumbnail: /assets/img/2014/ss.png
url: /2014/11/zabbix-network-socket-state-statistics.html
---
It's strange that zabbix-agent lacks for information about network socket states. At least it would be nice to monitor number of `ESTAB`, `TIME_WAIT` and `CLOSE_WAIT` connections.
Good that we can extend zabbix-agent - so I made this:
![](/assets/img/2014/ss.png)

Installation:
1. Save this as `/etc/zabbix/zabbix_agentd.conf.d/ss.conf`:
```bash
# Only UDP count returned on any sock[*] key query
# All other items send to trap keys at the same time
UserParameter=sock[*], /bin/ss -ant | grep -v State | awk 'BEGIN {s["CLOSE-WAIT"]=0;s["ESTAB"]=0;s["FIN-WAIT-1"]=0;s["FIN-WAIT-2"]=0;s["LAST-ACK"]=0;s["SYN-RECV"]=0;s["SYN-SENT"]=0;s["TIME-WAIT"]=0} {s[$$1]++} END {for (i in s) {print "- sock["i"]", s[i]}}' | /usr/bin/zabbix_sender -c /etc/zabbix/zabbix_agentd.conf -i - >/dev/null; /bin/ss -anu | wc -l
```
1. Import template with counters and graph  
[template_app_sockets.xml](https://github.com/sepich/zabbix/raw/master/templates/template_app_sockets.xml)

How it works:
- all counters have type `zabbix trapper`, but the `UDP` counter (which is active)
- when zabbix-agent asks for UDP connections count - all other counters will be sent to zabbix-server as traps at the same time
- you can adjust query interval which is by default 5 min


Quick theory:  
![](/assets/img/2014/tcp.gif)  
**LISTEN** - the local end-point is waiting for a connection request from a remote end-point i.e. a passive open was performed.  
**SYN-SENT** - the first step of the three-way connection handshake was performed. A connection request has been sent to a remote end-point i.e. an active open was performed.  
**SYN-RECEIVED** - the second step of the three-way connection handshake was performed. An  acknowledgement for the received connection request as well as a  connection request has been sent to the remote end-point.  
**ESTABLISHED** - the third step of the three-way connection handshake was performed. The connection is open.  
**FIN-WAIT-1** - the first step of an active close (four-way handshake) was performed.  The local end-point has sent a connection termination request to the  remote end-point.  
**CLOSE-WAIT** - the local end-point has received a connection termination request and  acknowledged it e.g. OS knows that the remote application has closed the connection and waits for the local application to also do so.  
**FIN-WAIT-2** - the remote end-point has sent an acknowledgement for the previously sent  connection termination request. The local end-point waits for second FIN packet from the remote end-point.  
**LAST-ACK** - represents waiting for an acknowledgment of the connection termination request previously sent to the remote end-point   
**CLOSING** - the local end-point is waiting for an acknowledgement for a connection termination request before going to the TIME-WAIT state.  
**TIME-WAIT** - from the local end-point point of view, the connection is closed but  we’re still waiting before accepting a new connection in order to  prevent delayed duplicate packets from the previous connection from  being accepted by the new connection. [According to RFC 793 a connection can stay in TIME-WAIT for a maximum of four minutes known as a 2xMSL (maximum segment lifetime).]

Due to the way TCP/IP works, connections can not be closed immediately. When connection in one direction is  terminated, the other party can continue sending data in the other  direction. Packets may arrive out of order or be retransmitted after the connection has been closed. `CLOSE_WAIT` indicates that the remote endpoint (other side of the connection) has closed the connection. `TIME_WAIT` indicates that local endpoint (this side) has closed the connection. The connection is being kept around so that any delayed packets can be matched to the connection and handled appropriately. The connections will be removed when they time out within some time.
So, basically, we can tune sysctl timeouts to influence upon `TIME_WAIT`, but `CLOSE_WAIT` is an application decision (until `socket.close()` is not executed)
