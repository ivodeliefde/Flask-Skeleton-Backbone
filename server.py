import os
from flask import Flask, render_template, request, json
import requests

app = Flask(__name__)

@app.route('/')
def start():
 	return render_template('Index.html')

@app.route('/makeRequest',  methods=['POST'])
def makeRequest():
	data = request.data
	dataDict = json.loads(data)	
	print type(dataDict), dataDict

	# r = requests.get("http://localhost/cgi-bin/pywps.cgi?service=wps&version=1.0.0&request=execute&identifier=GetSensorData")
	# print r
	# print r.content

 	return json.dumps("response, 200, {'Content-Type': 'text/plain'}")

if __name__ == '__main__':
  	app.run(debug=True)
