---
title: Article mobilizer plugin for tt-rss
date: '2013-05-24T03:32:00.000+04:00'
tags:
- www
modified: '2013-11-05T23:54:09.869+04:00'
thumbnail: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1hyhCqtgGTJDLq-cH2x4sITPngiD3WV4R56blgaNjgWJiowd4x4nToQEgUoCPqcftDCUzm4_Se7jnFx9pXfiRLWGJqlwKnsqFX_x3XpYdtqYZmWoyyN7vWsyAvBCRM4EMKa4EK3IYcJgj/s72-c/2.jpg
url: /2013/05/article-mobilizer-plugin-for-tt-rss.html
---
One feature that i've always missed in the **Gooogle Reader** was ability to open mobilized version of article link right in feed list (As it is done in **gReader** and **JustReader** mobile clients). What was problem for **Google Reader** is not a problem to implement for **Tiny Tiny RSS** - open source alternative of Google's product. This is my plugin which makes possible to read mobilized version of full-article linked from RSS-feed.
![](/assets/img/2013/mob1.jpg)
{width=500px}
For now you can choose from those mobilizing services for each feed separately:
- **Readability** (default option)
- **Instapaper**
- **Google Mobilizer**
- **Stripped Original** (original article without styles and images)
- **Original** (full original article)


This can be configured right from **tt-rss** feed config popup:
![](/assets/img/2013/mob2.jpg)
{width=500px}

Note about displaying `Original` article:  
Article content is displayed inside of iframe. But nested site can block displaying itself inside iframe by setting `X-Frame-Options: SAMEORIGIN` response header. Such is used at google.com, yandex.ru, habrahabr.ru and many more different sites. So `Original` display mode wouldn't work for them. Though all mobilizers and `Original Striped` will work ok, cause they are passing thru the stripping backend.

Installation:
- Download [mobilize.zip](http://i.sepa.spb.ru/_/mele/mobilize.zip) plugin  
Or checkout the [https://github.com/sepich/tt-rss-mobilize](https://github.com/sepich/tt-rss-mobilize)
- Put `/mobilize/` folder from archive to your `/tt-rss/plugins/` folder
- Open `tt-rss > Preferences > Plugins` and activate **Mobilize** plugin
- To open mobilized article press "zoom" button at article toolbar, or use hotkey <kbd>V</kbd>

Thanks:
To **macfly** for his plugin `auto_embed_original` which was great base for my plugin.
