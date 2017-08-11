build :
	mkdir -p app/data
	mkdir -p app/srv
	cp -r ../../github.js app
	cp -r ../../srv/*.js app/srv
	docker build -t nodezoo-github:1 .
	docker build -t nodezoo-github-prod:1 -f Dockerfile-prod .

clean :
	rm *~

.PHONY : build clean
