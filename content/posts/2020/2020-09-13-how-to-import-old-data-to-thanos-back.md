---
title: How to import old data to Thanos (back-filling)
date: '2020-09-13T17:29:00.001+03:00'
tags:
- thanos
modified: '2020-09-13T17:30:24.688+03:00'
thumbnail: /assets/img/2020/thanos.jpg
url: /2020/09/how-to-import-old-data-to-thanos-back.html
---
#### Short version
Now it is possible to backfill any custom data in prometheus text format to Thanos via my cli tool [https://github.com/sepich/thanos-kit](https://github.com/sepich/thanos-kit) and it's `import` command.

#### Long version
Input data should be in prometheus text format with timestamps, lines sorted by time. Let's prepare some test data:  
Format is `[metric]{[labels]} [value] [timestamp ms]`:
```bash
$ cat gen.sh
#!/bin/bash
ts_start=`date +%s -d '2020-09-11'`
ts_end=`date +%s -d '2020-09-12'`
scrape=15  # interval, sec

i=$ts_start
while [ $i -le $ts_end ]; do
  echo "test_metric_one{label=\"test1\"} ${RANDOM} ${i}000"
  echo "test_metric_two{label=\"test2\"} ${RANDOM} ${i}000"
  i=$((i+scrape))
done

$ get.sh > test.prom
$ head test.prom
test_metric_one{label="test1"} 10057 1599771600000
test_metric_two{label="test2"} 9341 1599771600000
test_metric_one{label="test1"} 24268 1599771615000
test_metric_two{label="test2"} 15110 1599771615000
test_metric_one{label="test1"} 26687 1599771630000
```

So we have two metrics with label `label` and timestamp (ms) is increasing by 15s. To import this to Thanos object storage we would also need to set additional Thanos Metadata Lables, which you are setting on Prometheus as `external_lables`. We usually set `prometheus` and `location` for Prometheuses in Thanos cluster.

```bash
docker run -it --rm \
    -v `pwd`:/work -w /work \
    -e GOOGLE_APPLICATION_CREDENTIALS=/work/svc.json \
    sepa/thanos-kit import \
        --objstore.config='{type: GCS, config: {bucket: bucketname}}' \
        --input-file test.prom \
        --label=prometheus=\"prom-a\" \
        --label=location=\"us-east1\"
```

Let's check imported data on object storage side:
```bash
docker run -it --rm \
    -v `pwd`:/work -w /work \
    -e GOOGLE_APPLICATION_CREDENTIALS=/work/svc.json \
    sepa/thanos-kit inspect
    --objstore.config='{type: GCS, config: {bucket: bucketname}}' \
    --selector=prometheus=\"prom-a\"

level=info ts=2020-09-13T13:50:10.121697Z caller=factory.go:46 msg="loading bucket configuration"
level=info ts=2020-09-13T13:50:11.832483Z caller=fetcher.go:452 component=block.BaseFetcher msg="successfully synchronized block metadata" duration=1.710190655s cached=235 returned=235 partial=1
|            ULID            |        FROM         |    RANGE     | LVL | RES | #SAMPLES | #CHUNKS |               LABELS                |    SRC     |
|----------------------------|---------------------|--------------|-----|-----|----------|---------|-------------------------------------|------------|
| 01EJ3VHZTZ254ZKPF14A7FC2GD | 11-09-2020 00:00:00 | 59m45.001s   | 1   | 0s  | 480      | 6       | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ09AYDAMNBDCFDFG287G | 11-09-2020 01:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ0QNHVMR0HCRB8Y0MB4Y | 11-09-2020 03:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ16ASD72EDPXFKSWYKPN | 11-09-2020 05:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ1P681X6ZGVE0GR0XZWD | 11-09-2020 07:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ2KJJG07EEKBM8Z97CDW | 11-09-2020 09:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ25087G2WPF5YHW8EZ57 | 11-09-2020 11:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VHYW7BH7M21Z5PWQCRVCC | 11-09-2020 13:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ31P86DQVCCZNVXVV2WC | 11-09-2020 15:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VHZAXAJAC34Z8P93NYZZ7 | 11-09-2020 17:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ3G1V3A5JX39N072V7KH | 11-09-2020 19:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ3ZBQ8W0BWQ4SSBQ7D8E | 11-09-2020 21:00:00 | 1h59m45.001s | 1   | 0s  | 960      | 10      | location=us-east1,prometheus=prom-a | thanos-kit |
| 01EJ3VJ4DE553YFE1RGX9MJ2TW | 11-09-2020 23:00:00 | 1h0m0.001s   | 1   | 0s  | 482      | 6       | location=us-east1,prometheus=prom-a | thanos-kit |
```
These 2h block would be merged to larger one via your `compactor` running on object storage, after default `--consistency-delay=30m` pass (which is based on file upload time, not `ULID`)

Now let's try to query our metric for specified date:
![](/assets/img/2020/thanos.jpg)
