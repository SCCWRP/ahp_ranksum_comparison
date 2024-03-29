FROM python:3.9.12
RUN pip install numpy
RUN pip install scipy
RUN pip install pandas
RUN pip install ahpy
RUN pip install sqlalchemy
RUN pip install flask
RUN pip install uwsgi
RUN pip install openpyxl
RUN pip install xlsxwriter
RUN pip install ipython

RUN apt-get update
RUN apt-get install -y apt-utils libpq-dev libpcre3 libpcre3-dev build-essential libssl-dev libffi-dev vim
RUN pip install psycopg2
