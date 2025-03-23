---
title: D-Link DIR-620 OpenWRT installation
date: '2013-01-13T21:28:00.000+04:00'
tags:
- linux
- dir620
- openwrt
modified: '2013-01-13T21:36:54.495+04:00'
thumbnail: /assets/img/2012/mount.png
url: /2013/01/d-link-dir-620-openwrt-installation.html
---
I've used OpenWRT for my D-Link DIR-620 A1 for almost a year now. Good news that OpenWRT community released already compiled beta versions (Latest for now is [12.09-rc1](http://downloads.openwrt.org/attitude_adjustment/12.09-rc1/ramips/rt305x/openwrt-ramips-rt305x-dir-620-a1-squashfs-sysupgrade.bin) So now it's no need to compile trunk sources to get firmware for ramips hardware. My custom image is getting old, so I've decided to install latest community release.

This article is mostly for myself. Just want to leave some notes in case I'll need to update firmware again.
### uboot  
Uboot was updated to 3.3.4 from [deadc0de](http://www.deadc0de.ru/downloads.html). This makes possible to use such recovery procedure:  
- set local IP address to 10.10.10.3/24 and run [tftp server](http://tftpd32.jounin.net/)
- place firmware named as `rt305x_firmware.bin` to root of tftp server  
- turn-on the router while holding RESET button pressed for 5 sec  
- router will start updating from tftp  
It's possible to flash any firmware from tftp (original, dd-wrt, Kinetic or this OpenWRT)  
  
### Root FS on external storage  
Router has only 8mb of flash which is enough for samba + transmission. But when you want minidlna, OpenVPN etc there is only choice - to use USB storage for increasing root partition. We'll need some additional packages for this:  
```bash
opkg install block-mount hotplug2  kmod-usb2 kmod-usb-storage kmod-fs-vfat kmod-fs-ext4 kmod-nls-cp1251 kmod-nls-cp437 kmod-nls-cp866 kmod-nls-iso8859-1 kmod-nls-utf8 kmod-loop e2fsprogs fdisk mkdosfs losetup
```
Then I'll [repartition](http://tldp.org/HOWTO/Partition/fdisk_partitioning.html) my 16Gb USB-drive.   
```bash
root@gw:~# fdisk /dev/sda
```
And the result is first 11Gb FAT32 and second 2Gb EXT3 partitions. (FAT32 was used for compatibility with Windows, so I can use this USB-drive without of router)  
```bash
root@gw:~# fdisk /dev/sda -l
Disk /dev/sda: 16.0 GB, 16025387008 bytes
64 heads, 32 sectors/track, 15283 cylinders, total 31299584 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk identifier: 0x4ea7b52a
Device Boot      Start         End      Blocks   Id  System
/dev/sda1            2048    27265023    13631488    b  W95 FAT32
/dev/sda2        27265024    31299583     2017280   83  Linux

```
Format those partitions:  
```bash
root@gw:~# mkfs.vfat -F 32 /dev/sda1
root@gw:~# mkfs.ext3 -j /dev/sda2
```
Then prepare mount points. I put a marker file to each mount folder to easy understand if drive is not mounted, and set read only access to folders. So if drive not mounted, processes couldn't write to folders taking router flash space.  
```bash
root@gw:~# mkdir /mnt/sda1
root@gw:~# mkdir /mnt/sda2
root@gw:~# touch /mnt/sda1/USB_DISK_NOT_PRESENT
root@gw:~# touch /mnt/sda2/USB_DISK_NOT_PRESENT
root@gw:~# chmod -R 444 /mnt/sda1
root@gw:~# chmod -R 444 /mnt/sda2
```
Ok, now I'll mount EXT3 partition and prepare it for root FS. ([There](https://forum.openwrt.org/viewtopic.php?id=27750) is performance tests for different mount options)  
```bash
root@gw:~# mount -t ext4 -o data=writeback,barrier=1 /dev/sda2 /mnt/sda2
root@gw:~# tar -C /overlay -cvf - . | tar -C /mnt/sda2 -xf -
```
For FAT32 I use different options, for support of Cyrillic file names. It's possible to configure at Luci  
![](/assets/img/2013/mount.png)   
Or by editing `/etc/config/fstab`:  
```conf
config global 'automount'
option from_fstab '1'
option anon_mount '1'

config global 'autoswap'
option from_fstab '1'
option anon_swap '0'

config mount
option fstype 'vfat'
option options 'rw,sync,codepage=866,iocharset=cp1251,utf8,umask=000,dmask=000,fmask=000,uid=65534,gid=65534'
option enabled '1'
option device '/dev/sda1'
option target '/mnt/sda1'

config mount
option enabled '1'
option device '/dev/sda2'
option fstype 'ext4'
option options 'data=writeback,barrier=1'
option enabled_fsck '1'
option is_rootfs '1'
```

### swap
My EXT3 partition is still mounted, and I'll create a swap file on it, instead of using extra swap partition. 256Mb will be enough :)  
```bash
root@gw:~# dd if=/dev/zero of=/mnt/sda2/swapfile bs=1M count=256
```   
Create file `/etc/init.d/swap`:  
```bash
#!/bin/sh /etc/rc.common
# Copyright (C) 2007 OpenWrt.org
START=98
sleep 5

start() {
  if [ -e /swapfile ]
  then
    #dd if=/dev/zero of=/swapfile count=256 bs=1M
    losetup /dev/loop0 /swapfile
    mkswap /dev/loop0
    swapon /dev/loop0
  fi
}

stop() {
  swapoff /dev/loop0
}
```
Make this file executable and enable autostart for it.  
```bash
root@gw:~# chmod +x /etc/init.d/swap
root@gw:~# /etc/init.d/swap enable
root@gw:~# reboot
```
After reboot EXT3 partition must be mounted as root (/overlay). Swap script must check existence of <b>/swapfile</b> and mount it.  
```bash
root@gw:~# free
total         used         free       shared      buffers
Mem:         29848        28832         1016            0         1692
-/+ buffers:              27140         2708
Swap:       262140         4076       258064

root@gw:~# df -h
Filesystem                Size      Used Available Use% Mounted on
rootfs                    1.9G    310.3M      1.5G  17% /
/dev/root                 1.8M      1.8M         0 100% /rom
tmpfs                    14.6M    652.0K     13.9M   4% /tmp
tmpfs                   512.0K         0    512.0K   0% /dev
/dev/sda2                 1.9G    310.3M      1.5G  17% /overlay
overlayfs:/overlay        1.9G    310.3M      1.5G  17% /
/dev/sda1                13.0G    239.7M     12.8G   2% /mnt/sda1
```
Now root has 1.5Gb of free space and It's easy to install all additional services like minidlna, pptp, aiccu, boxbackup etc  
  
### PS  
That's seems wonderful, but performance of DIR620 is very limited :( `Transmission` effectively can download no more than 3 downloads at once. `Minidlna` and `samba` storage transfer speeds is about 2Mb/s. This system is good for playing with all services. But to use them actively its need to have more power. So now i'm a fan of [cubieboard.org](http://cubieboard.org/) :) Hope I'll get one and may be'll write about.
