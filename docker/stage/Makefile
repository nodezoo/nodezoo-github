build :
	mkdir -p app/data
	mkdir -p app/srv
	cp -r ../../github.js app
	cp -r ../../srv/*.js app/srv
	docker build -t nodezoo-github .

clean :
	rm *~

.PHONY : build clean
