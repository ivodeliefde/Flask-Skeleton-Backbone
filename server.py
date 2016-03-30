import os
from flask import Flask, render_template, request, json, url_for
import requests
from lxml import etree
from werkzeug import secure_filename

geoFiles = {}
SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
for each in ['Municipality','Province','Raster 10km2','Raster 100km2']:
	json_url = os.path.join(SITE_ROOT, "static", "geo/{0}.json".format(each) )
	data = json.load(open(json_url))
	geoFiles[each] = data

UPLOAD_FOLDER = 'static/uploads/'
ALLOWED_EXTENSIONS = set(['json'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def start():
	return render_template('Index.html')

@app.route('/getSensors',  methods=['POST'])
def getSensors():
	data = request.data
	dataDict = json.loads(data)	
	# print type(dataDict), dataDict

	url = "http://localhost/cgi-bin/pywps.cgi?service=wps&version=1.0.0&request=execute&identifier=GetSensors&DataInputs=[feature_names={0};feature_category={1};observed_properties={2}]".format(dataDict['feature'],dataDict['featureType'],dataDict['obsProperty'])
	# print url

	r = requests.get(url)
	# print r
	root = etree.fromstring(r.content)
	nsm = root.nsmap
	sensors = root.find(".//wps:ComplexData",nsm).text
	# print sensors
	return json.dumps({"sensors": sensors})

@app.route('/getSensorData',  methods=['POST'])
def getSensorData():
	print "Get Sensor Data"
	data = request.data
	dataDict = json.loads(data)	
	# print type(dataDict), dataDict

	count = len([name for name in os.listdir(app.config['UPLOAD_FOLDER']) if os.path.isfile(os.path.join(app.config['UPLOAD_FOLDER'], name))]) + 1
	filename = secure_filename("sensors_{0}.json".format(count))
	sensorsURL = "{0}".format(os.path.join(app.config['UPLOAD_FOLDER'], filename))
	with open(sensorsURL, 'w') as f:
		# print dataDict['sensors']
		f.write(json.dumps(dataDict['sensors']))
	
	url = "http://localhost/cgi-bin/pywps.cgi?service=wps&version=1.0.0&request=execute&identifier=GetSensorData&DataInputs=[feature_names={0};feature_category={1};observed_properties={2};temporal_range={3},{4};temporal_granularity={5};temporal_aggregation={6};spatial_aggregation={7};Sensors=http://localhost:5000/{8}]".format(dataDict['feature'],dataDict['featureType'],dataDict['obsProperty'],dataDict['startTime'],dataDict['endTime'],dataDict['tempGran'],dataDict['tempAggType'],dataDict['spatialAggType'], sensorsURL)
	print url

	r = requests.get(url)
	# print r
	# print r.content
	root = etree.fromstring(r.content)
	nsm = root.nsmap
	sensorData = root.find(".//wps:ComplexData",nsm).text
	print sensorData

	csvDataURL = "www.csvDataURL.com"

	return json.dumps({"url": csvDataURL})



@app.route('/getGeoJSON',  methods=['POST'])
def getGeoJSON():
	data = json.loads(request.data)
	category = data['category']
	# print category
	return json.dumps(geoFiles[category])


if __name__ == '__main__':
	app.run(debug=True)
