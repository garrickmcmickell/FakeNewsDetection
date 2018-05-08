
import sklearn
from pymongo import MongoClient 
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_selection import VarianceThreshold

client = MongoClient(port=27017)
db = client.jsAppTest
coll = db.textData

test = coll.find({})[0][u'arr']
for parent in test:
    for child in parent:
        parent[child] = parent[child].encode('ascii', 'ignore')
        parent[child.encode('ascii', 'ignore')] = parent.pop(child)
        
vec = sklearn.feature_extraction.DictVectorizer()
vec_vectorized = vec.fit_transform(test)
X = vec_vectorized.toarray()
y = [0] * X.shape[0]
sel = VarianceThreshold(threshold=(.8 * (1 - .8)))
X = sel.fit_transform(X, y)
res = []
for i in range(0, X.size):
    if(X[i][0] > 0):
        res.append(test[i])
print res









