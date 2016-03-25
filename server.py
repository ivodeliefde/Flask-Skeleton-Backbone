import os
from flask import Flask, render_template, request, json, url_for
import requests
from lxml import etree

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

@app.route('/getSensors',  methods=['POST'])
def getSensors():
	data = request.data
	dataDict = json.loads(data)	
	print type(dataDict), dataDict

	url = "http://localhost/cgi-bin/pywps.cgi?service=wps&version=1.0.0&request=execute&identifier=GetSensors&DataInputs=[feature_names={0};feature_category={1}]".format(dataDict['feature'],dataDict['featureType'])
	print url

	r = requests.get(url)
	print r
	root = etree.fromstring(r.content)
	nsm = root.nsmap
	sensors = root.find(".//wps:ComplexData",nsm).text
	print sensors
	return json.dumps({"sensors": sensors})


@app.route('/getGeoJSON',  methods=['POST'])
def getGeoJSON():
	data = json.loads(request.data)
	category = data['category']
	# print category
	return json.dumps(geoFiles[category])

if __name__ == '__main__':
	app.run(debug=True)
