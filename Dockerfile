# nodezoo-github

FROM node:4

ADD . /

EXPOSE 44004
EXPOSE 43004

CMD ["node","srv/github-dev.js","--seneca.options.tag=github","--seneca.log.all"]

# build and run:
# $ docker build -t nodezoo-github-03 .
# $ docker run -d -p 44004:44004 -p 43004:43004 -e HOST=$(docker-machine ip default) -e REDIS=192.168.99.1 -e TOKEN=`cat srv/.ignore-token` --volumes-from nodezoo-level nodezoo-github-03
# local docker ip:
# $ docker-machine ip default


