import numpy as np
import matplotlib.pyplot as plt
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer, TfidfTransformer 

# Required function for tokenizing and preprocessing data since it is a list, not raw text
def getChunks(sample):
  for word in sample:
    yield word

#Connect to MongoDB
client = MongoClient(port=27017)
db = client.phraseChunk

#Query and format training data for real samples
query = db.train.find({})
train_real = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 0]) for item in query for key in item if key != u'_id'])

#Query and format training data for fake samples
query = db.test.find({})
train_fake = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1]) for item in query for key in item if key != u'_id'])

#Query and format test data for fake samples
query = db.test2.find({})
test_fake = np.array([np.array([[item[key][i].encode('ascii', 'ignore') for i in range(len(item[key]))], 1]) for item in query for key in item if key != u'_id'])

#Made train and test variables
X_train = np.concatenate((train_real[:, 0], train_fake[:, 0]), axis=0)
y_train = np.concatenate((train_real[:, 1], train_fake[:, 1]), axis=0).tolist()
X_test = test_fake[:, 0]
y_test = test_fake[:, 1].tolist()

#Fit and transform data
vec = TfidfVectorizer( analyzer=getChunks)
X_train = vec.fit_transform(X_train)
X_test = vec.transform(X_test)

print ''

