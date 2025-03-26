serve:
	rm -r ./.public/ 2>/dev/null || true
	hugo server -D #--navigateToChanged

page:
	hugo new content content/posts/my-first-post.md

build:
	rm -r ./.public/ 2>/dev/null || true
	HUGO_SERVICES_GOOGLEANALYTICS_ID=G-171JJY7BV0 hugo
