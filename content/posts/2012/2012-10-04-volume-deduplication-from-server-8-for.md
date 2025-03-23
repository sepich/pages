---
title: Install volume deduplication from Server 2012 to Windows 8
date: '2012-10-04T16:24:00.001+04:00'
tags:
- windows
modified: '2013-07-01T16:16:04.980+04:00'
thumbnail: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgIVgIuPiD5qnGHvVJKse9bY3F6k3gcdwqa4vJ5AulnpsfaYpUXUsWWGxvYbL1Z2CxgmxYMYLvDJHIqHbZivdExFhAdn2EQsT7ZbX5ZgsRBiQ_rdjILhOGY-2UysLm-IUe1kFt2GZ4s-vA4/s72-c/folder.png
url: /2012/10/volume-deduplication-from-server-8-for.html
---
Server 2012 has a great feature - Deduplication. It can be very effective to optimize storage and reduce the  amount of disk space consumed—50% to 90% when applied to the right data. Cause Windows 8 has a Hyper-V 3 too, deduplication will be very useful for VM vhd storage volume. This is my VM folder example:  
![](/assets/img/2012/folder.png)
{ height="300px"}  
And this example taken from Windows 8 =) So, it's possible to install deduplication service to Windows 8 with one caveat - it'll have no GUI. Only possible way to manage it - is Powershell.  
 
If it's ok for you, then download correct version of deduplication service for your Windows 8 build number from [here](http://forums.mydigitallife.info/threads/34417-Data-deduplication-for-Windows-8-x64). I'll repeat links here:  
Windows 8 Release Preview ([build 8400](http://www.mediafire.com/?5m9ljlc14ae94qo))  
Windows 8 Retail ([build 9200](http://www.mediafire.com/?anjx6rs4l8a7puf))  
Then install service from elevated prompt:  
```
dism /online /add-package /packagepath:Microsoft-Windows-VdsInterop-Package~31bf3856ad364e35~amd64~~6.2.8400.0.cab /packagepath:Microsoft-Windows-VdsInterop-Package~31bf3856ad364e35~amd64~en-US~6.2.8400.0.cab /packagepath:Microsoft-Windows-FileServer-Package~31bf3856ad364e35~amd64~~6.2.8400.0.cab /packagepath:Microsoft-Windows-FileServer-Package~31bf3856ad364e35~amd64~en-US~6.2.8400.0.cab /packagepath:Microsoft-Windows-Dedup-Package~31bf3856ad364e35~amd64~~6.2.8400.0.cab /packagepath:Microsoft-Windows-Dedup-Package~31bf3856ad364e35~amd64~en-US~6.2.8400.0.cab
dism /online /enable-feature /featurename:Dedup-Core /all
```
Ok, let's configure some volume!  
`Enable-DedupVolume E:`  
By default, the dedupe process will only affect files that have not been changed for 30 days. To disable this use:  
`Set-DedupVolume E: -MinimumFileAgeDays 0`  
And we are going to start deduplication job, it can take a long time for the first run on volume with data  
`Start-DedupJob E: –Type Optimization`  
Use such command to view status of this Job:  
`Get-DedupJob`  
But it's no need to run such Job every time you changed data on a volume. Installation of service already create some scheduled task for you:  
![](/assets/img/2012/task.jpg)
{ height="300px"}  
So all you need - just customize time of those tasks if you want to.  
  
UPD 1.07.13  
[Here](http://forums.mydigitallife.info/threads/34417-Data-deduplication-for-Windows-8-x64/page7?p=769315&viewfull=1#post769315) is deduplication feature for new Windows 8.1
