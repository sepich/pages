---
title: Debian Wheezy and Brocade 1010/1020/1007 10Gbps CNA
date: '2014-02-14T22:27:00.000+04:00'
tags:
- linux
modified: '2014-02-14T22:51:00.130+04:00'
url: /2014/02/debian-wheezy-and-brocade-101010201007.html
---
There are two ways to make Brocade 1010/1020/1007 10Gbps CNA working in Debian Wheezy:
1. Right way: Go to official Brocade site, download 3Gb(!) [iso image](http://www.brocade.com/services-support/drivers-downloads/adapters/ISO.page) with binaries for kernel-2.6 (!) and sources. Compile sources for Debian's kernel-3.2.
1. Quick way: It's not right but just works, if you need quickly enable networking with new kernel.

That's what we got:
```bash
# lspci | grep Brocade
04:00.0 Fibre Channel: Brocade Communications Systems, Inc. 1010/1020/1007 10Gbps CNA (rev 01)
04:00.1 Fibre Channel: Brocade Communications Systems, Inc. 1010/1020/1007 10Gbps CNA (rev 01)
04:00.2 Ethernet controller: Brocade Communications Systems, Inc. 1010/1020/1007 10Gbps CNA (rev 01)
04:00.3 Ethernet controller: Brocade Communications Systems, Inc. 1010/1020/1007 10Gbps CNA (rev 01)
```

So, hardware it here, but nothing in `ifconfig -a`. Official Debian [firmware wiki](https://wiki.debian.org/Firmware) states that we need `bfa.ko` and `bna.ko`.

```bash
# modinfo bna
filename:       /lib/modules/3.2.0-4-amd64/kernel/drivers/net/ethernet/brocade/bna/bna.ko
firmware:       ct2fw.bin
firmware:       ctfw.bin
version:        3.0.2.2
description:    Brocade 10G PCIe Ethernet driver
license:        GPL
author:         Brocade
...

# modinfo bfa
filename:       /lib/modules/3.2.0-4-amd64/kernel/drivers/scsi/bfa/bfa.ko
version:        3.0.2.2
author:         Brocade Communications Systems, Inc.
description:    Brocade Fibre Channel HBA Driver fcpim
license:        GPL
firmware:       ct2fw.bin
firmware:       ctfw.bin
firmware:       cbfw.bin
...

# ls /lib/firmware/c*
```

And kernel modules are indeed there. But what about firmware binaries? Links from Debian wiki going nowhere, no packages (firmware-free, firmware-non-free) providing `ctfw.bin`.   
So, we just need find this `ctfw.bin` v3.0.2.2 for kernel-3.2 x64.
Unfortunately I was unable to find this exact version of binary too, what i've found was v3.0.3.1 courtesy provided by fedora community:
[http://rpmfind.net/linux/rpm2html/search.php?query=bfa-firmware](http://rpmfind.net/linux/rpm2html/search.php?query=bfa-firmware)

```bash
wget ftp://fr2.rpmfind.net/linux/fedora/linux/releases/18/Everything/x86_64/os/Packages/b/bfa-firmware-3.0.3.1-1.fc18.noarch.rpm
rpm2cpio bfa-firmware-3.0.3.1-1.fc18.noarch.rpm | cpio --extract --make-directories
mv lib/firmware/c* /lib/firmware
```

Don't forget to re-create initramfs:
```bash
update-initramfs -u -k all
```

Rebooting and checking dmesg:
```bash
Feb 13 04:58:54 servername kernel: [   12.596396] bna: eth1 link up
Feb 13 04:58:54 servername kernel: [   12.596404] bna: eth1 0 TXQ_STARTED
Feb 13 04:58:54 servername kernel: [   12.679901] bonding: bond0: link status up for interface eth1, enabling it in 0 ms.
Feb 13 04:58:54 servername kernel: [   12.679906] bonding: bond0: link status definitely up for interface eth1, 10000 Mbps full duplex.
Feb 13 04:58:54 servername kernel: [   12.680894] ADDRCONF(NETDEV_CHANGE): bond0: link becomes ready
Feb 13 04:58:54 servername kernel: [   20.416924] bna: eth0 link up
Feb 13 04:58:54 servername kernel: [   20.416931] bna: eth0 0 TXQ_STARTED
Feb 13 04:58:54 servername kernel: [   20.460381] bonding: bond0: link status up for interface eth0, enabling it in 200 ms.
Feb 13 04:58:54 servername kernel: [   20.659888] bonding: bond0: link status definitely up for interface eth0, 10000 Mbps full duplex.
```
