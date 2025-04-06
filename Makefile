page:
	hugo new content content/posts/my-first-post.md

clean:
	rm -r ./.public/ 2>/dev/null || true

serve: clean
	hugo server -D #--navigateToChanged

build: clean
	HUGO_SERVICES_GOOGLEANALYTICS_ID=G-171JJY7BV0 hugo

publish: build
	rsync -a --del  .public/ oracle:/data/data/www/blog/
