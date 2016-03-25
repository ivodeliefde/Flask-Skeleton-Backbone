import os
from flask import Flask, render_template, request, json, url_for
import requests

geoFiles = {}
SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
for each in ['Municipality','Province','Raster 10km2','Raster 100km2']:
	json_url = os.path.join(SITE_ROOT, "static", "geo/{0}.json".format(each) )
	data = json.load(open(json_url))
	geoFiles[each] = data


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


@app.route('/getGeoJSON',  methods=['POST'])
def getGeoJSON():
	data = json.loads(request.data)
	category = data['category']
	# print category
	return json.dumps(geoFiles[category])

if __name__ == '__main__':
	app.run(debug=True)
