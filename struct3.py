print(__doc__)

import numpy as np
import matplotlib.pyplot as plt
from pymongo import MongoClient 
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

#Connect to MongoDB
client = MongoClient(port=27017)
db = client.jsAppTest

#Query training data
query = db.train2.find({})
X_train = [[item[key] for key in item if key != u'_id'] for item in query]

#Query test data
query = db.train.find({})
X_test = [[item[key] for key in item if key != u'_id'] for item in query]

#Keys are backwards, reverse
for item in X_train:
  item.reverse()

for item in X_test:
  item.reverse()
  
#Categorize training data by pos
train_posPoints = {}
for item in X_train:
  if(train_posPoints.has_key(item[0])):
    train_posPoints[item[0]].append([item[1], item[2]])
  else:
    train_posPoints[item[0]] = [[item[1], item[2]]]

#Categorize test data by pos
test_posPoints = {}
for item in X_test:
  if(test_posPoints.has_key(item[0])):
    test_posPoints[item[0]].append([item[1], item[2]])
  else:
    test_posPoints[item[0]] = [[item[1], item[2]]]

#Convert categorized training data to np.array
for pos in train_posPoints:
  train_posPoints[pos] = np.array(train_posPoints[pos])

#Convert categorized training data to np.array
for pos in test_posPoints:
  test_posPoints[pos] = np.array(test_posPoints[pos])

#Generate regression line for training data and find the r2 difference to determine difference
differences = {}
for key in test_posPoints:
  if key in train_posPoints:
    #Set training data for pos
    x_train = train_posPoints[key][:, 0]
    y_train = train_posPoints[key][:, 1]

    #Set test data for pos
    x_test = test_posPoints[key][:, 0]
    y_test = test_posPoints[key][:, 1]

    #Fit model
    model = LinearRegression(fit_intercept=True)
    model.fit(x_train[:, np.newaxis], y_train)

    #Predict for train and test
    y_pred_train = model.predict(x_train[:, np.newaxis])
    y_pred_test = model.predict(x_test[:, np.newaxis])

    #Get r2 scores for train and test selected pos
    train_score = r2_score(y_train, y_pred_train)
    test_score = r2_score(y_test, y_pred_test)

    #Calculate percent difference between test and train for selected pos using r2  
    if(train_score == 0):
      score_diff = abs(test_score)
    else:
      score_diff = (test_score / train_score) % 1

    differences[key] = score_diff

total_difference = sum(differences.values()) / len(differences)

#Test model for display only
#model_test = LinearRegression(fit_intercept=True)
#model_test.fit(x_test[:, np.newaxis], y_test)
#y_model_test = model_test.predict(x_test[:, np.newaxis])
#plt.plot(x_train, y_pred_train, color='blue')
#plt.plot(x_test, y_model_test, color="red")
#fit = np.polyfit(x, y, 1)
#fit_fn = np.poly1d(fit) 
#
#plt.title("Test")
#
#plt.plot(x, fit_fn(x), '--k'
#plt.show()

print ''
