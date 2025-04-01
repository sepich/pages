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
For now you can choose from those mobilizing services for each feed separately:
- **Readability** (default option)
- **Instapaper**
- **Google Mobilizer**
- **Stripped Original** (original article without styles and images)
- **Original** (full original article)


This can be configured right from **tt-rss** feed config popup:
![](/assets/img/2013/mob2.jpg)

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

Comments imported from blogger:
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2013-06-10T05:45:37.699+04:00">05:45, 10 June 2013</time>:<br/>
This looks really interesting, but I was not able to get it working. When looking at the code it appears that you have written this to work with MySQL, but I&#39;m using PostgreSQL. Is there any chance you might be able to recode to make it work the PostgreSQL as this is the recommended DB for TT-RSS?<br /><br />Thanks</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2013-06-10T19:25:25.324+04:00">19:25, 10 June 2013</time>:<br/>
Ok, I&#39;ll look into this when get some free time</div>
<div class="comment"><img src="//sjdg89.free.fr/bisounours.jpg"/><a href="https://www.blogger.com/profile/18016769219526559384">bisounours</a> at <time datetime="2013-06-30T14:53:20.814+04:00">14:53, 30 June 2013</time>:<br/>
Hi, I had the same pb and resolved it by manually creating the tables:<br /><br />psql -d ttrss_db -U postgres<br /><br />then:<br />CREATE TABLE &quot;plugin_mobilize_feeds&quot; ( &quot;id&quot; int NOT NULL, &quot;owner_uid&quot; int NOT NULL, &quot;mobilizer_id&quot; int NOT NULL, PRIMARY KEY (&quot;id&quot;,&quot;owner_uid&quot;) ) ;<br />ALTER TABLE &quot;plugin_mobilize_feeds&quot; OWNER TO &quot;ttrss_user&quot; ;<br /><br />CREATE TABLE &quot;plugin_mobilize_mobilizers&quot; ( &quot;id&quot; int NOT NULL, &quot;description&quot; varchar(255) NOT NULL, &quot;url&quot; varchar(1000) NOT NULL, PRIMARY KEY (&quot;id&quot;) ) ;<br />ALTER TABLE &quot;plugin_mobilize_mobilizers&quot; OWNER TO &quot;ttrss_user&quot; ;<br /><br />INSERT INTO &quot;plugin_mobilize_mobilizers&quot; ( &quot;id&quot;, &quot;description&quot;, &quot;url&quot;) VALUES<br />        (0, &#39;Readability&#39;, &#39;http://www.readability.com/m?url=%s&#39;),<br />        (1, &#39;Instapaper&#39;, &#39;http://www.instapaper.com/m?u=%s&#39;),<br />        (2, &#39;Google Mobilizer&#39;, &#39;http://www.google.com/gwt/x?u=%s&#39;),<br />        (3, &#39;Original Stripped&#39;, &#39;http://strip=%s&#39;),<br />        (4, &#39;Original&#39;, &#39;%s&#39;);<br /><br />And now, the plugin works for me.<br /><br />Thank you for your work!!</div>
<div class="comment"><img src="//resources.blogblog.com/img/blank.gif"/><a href="#">Anonymous</a> at <time datetime="2013-11-05T15:43:01.279+04:00">15:43, 05 November 2013</time>:<br/>
Too bad it&#39;s MySQL-only. Maybe put it on github and let the community do the work? :)</div>
<div class="comment"><img src="//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPIpsFZxeXhwYiaSZFfaBPHaq47D5RjLrUTuKOI_W56xwu2EUEm5gpwBmn6mTlXeSGQMaEmVd4aZENpSrUZQxNXaELJA-QehvcCmMPoa7dXhqdTPW34s6syA1ZCo6yvsI/s1600/avatar.png"/><a href="https://www.blogger.com/profile/15219082553292373774">sepa</a> at <time datetime="2013-11-05T23:53:19.970+04:00">23:53, 05 November 2013</time>:<br/>
Great idea!<br />https://github.com/sepich/tt-rss-mobilize<br />I&#39;ve updated the article</div>
