from __future__ import division
import numpy as np
import matplotlib
import csv
import operator
import ast
import matplotlib.pyplot as plt
import SimpleHTTPServer
import SocketServer
import string

pops= {}
with open('population.csv', 'rb') as csvf:
	reader = csv.reader(csvf, delimiter=',', quotechar='|')
	for row in reader:
		if row[2] == '2013':
			pops[row[0]] = row[3]

syria = {}
biggestAnnual = {}

totalRefsFrom = {}
totalRefsTo = {}
totalRefsToWithCountriesFrom = {}
totalRefsFromTo = {}
refsFromToYears = {}
refsToYearsFrom = {}
mostRefs = {}
mostRefsFrom = {}

with open('undata1.csv', 'rb') as csvfile:
	reader = csv.reader(csvfile, delimiter=',', quotechar='|')
	for row in reader:
		countryFrom = row[1]
		countryTo = row[0]
		if row[3].isdigit():
			numberRefs = int(row[3])
		year = row[2]

		#totalRefsFrom[x][y] = total refugees from country x in year y
		if row[3].isdigit():
			if int(year)>2000:
				if countryTo in mostRefs:
					mostRefs[countryTo] += numberRefs
				else:
					mostRefs[countryTo] = numberRefs
				if countryFrom in mostRefsFrom:
					mostRefsFrom[countryFrom] += numberRefs
				else:
					mostRefsFrom[countryFrom] = numberRefs	
			if countryFrom in totalRefsFrom:
				if year in totalRefsFrom[countryFrom]:
					totalRefsFrom[countryFrom][year] += numberRefs
				else:
					totalRefsFrom[countryFrom][year] = numberRefs
			else:
				totalRefsFrom[countryFrom] = {}
				totalRefsFrom[countryFrom][year] = numberRefs

			combinedKey = repr([countryFrom,countryTo])
			if combinedKey in totalRefsFromTo:
				totalRefsFromTo[combinedKey][year] = numberRefs
			else:
				totalRefsFromTo[combinedKey] = {}
				totalRefsFromTo[combinedKey][year] = numberRefs

			#if countryTo in pops:
			if countryTo in totalRefsTo:
				if year in totalRefsTo[countryTo]:
					totalRefsTo[countryTo][year] += numberRefs # / float(pops[countryTo])
				else:
					totalRefsTo[countryTo][year] = numberRefs #/ float(pops[countryTo])
			else:
				totalRefsTo[countryTo] = {}
				totalRefsTo[countryTo][year] = numberRefs #/ float(pops[countryTo])
			
		if year.isdigit():
			# if countryTo in refsFromToYears:
			# 	if year in refsFromToYears[countryTo]:
			# 		refsFromToYears[countryTo][year][countryFrom] = numberRefs
			# 	else:
			# 		refsFromToYears[countryTo][year] = {}
			# 		refsFromToYears[countryTo][year][countryFrom] = numberRefs
			# else:
			# 	refsFromToYears[countryTo] = {}
			# 	refsFromToYears[countryTo][year] = {}
			# 	refsFromToYears[countryTo][year][countryFrom] = numberRefs

			if countryTo in refsToYearsFrom:
				if countryFrom in refsToYearsFrom[countryTo]:
					refsToYearsFrom[countryTo][countryFrom][year] = numberRefs
				else:
					refsToYearsFrom[countryTo][countryFrom] = {}
					refsToYearsFrom[countryTo][countryFrom][year] = numberRefs
			else:
				refsToYearsFrom[countryTo] = {}
				refsToYearsFrom[countryTo][countryFrom] = {}
				refsToYearsFrom[countryTo][countryFrom][year] = numberRefs

			if countryFrom in refsFromToYears:
				if countryTo in refsFromToYears[countryFrom]:
					refsFromToYears[countryFrom][countryTo][year] = numberRefs
				else:
					refsFromToYears[countryFrom][countryTo] = {}
					refsFromToYears[countryFrom][countryTo][year] = numberRefs
			else:
				refsFromToYears[countryFrom] = {}
				refsFromToYears[countryFrom][countryTo] = {}
				refsFromToYears[countryFrom][countryTo][year] = numberRefs

		if row[1] == 'Syrian Arab Rep.':
			syria[repr([row[0],row[2]])] = row[3]
			if row[0] in biggestAnnual: 
				if row[3] > biggestAnnual[row[0]][1]:
					biggestAnnual[row[0]] = [row[2],row[3]]
			else:
				biggestAnnual[row[0]] = [row[2],row[3]]

sorted_refs_to = sorted(totalRefsTo.items(), key=operator.itemgetter(1), reverse=True)
sorted_totalRefs = sorted(totalRefsFromTo.items(), key=operator.itemgetter(1), reverse=True)
mostRefs = sorted(mostRefs.items(), key=operator.itemgetter(1), reverse=True)
mostRefsFrom = sorted(mostRefsFrom.items(), key=operator.itemgetter(1), reverse=True)

refsFromToYears_sorted = sorted(refsFromToYears.items(), key=operator.itemgetter(1), reverse=True)
refugeeInTop = {}



for country in sorted_refs_to[:10]:
	for x in sorted_totalRefs:
		if ast.literal_eval(x[0])[1] == country[0]:
			if country[0] in refugeeInTop:
				refugeeInTop[country[0]].append(x)
			else:#
				refugeeInTop[country[0]] = []
				refugeeInTop[country[0]].append(x)

for x in refugeeInTop:
	refugeeInTop[x].sort(key=operator.itemgetter(1), reverse=True)


print totalRefsFrom
#print totalRefsFrom['Syrian Arab Rep.']

print refsToYearsFrom['Jordan']
# for item in refsToYearsFrom['Jordan']:
# 	a = sorted(refsToYearsFrom['Jordan'][item].items(),key=operator.itemgetter(0), reverse=True)
# 	plt.plot([i[0] for i in a], [i[1] for i in a])
# 	print item
# 	plt.title(item.encode("utf8")+' to Jordan')
# 	plt.show()

numberOfCountriesShown = 25
yrs = ['2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013']
with open('topCountries.csv','wb') as csvfile:
	csvwriter = csv.writer(csvfile, delimiter=',', quotechar='|', quoting=csv.QUOTE_MINIMAL)
	csvwriter.writerow([c[0] for c in mostRefs[:numberOfCountriesShown]])
with open('topCountriesFrom.csv','wb') as csvfile:
	csvwriter = csv.writer(csvfile, delimiter=',', quotechar='|', quoting=csv.QUOTE_MINIMAL)
	csvwriter.writerow([c[0] for c in mostRefsFrom[:numberOfCountriesShown]])
for refCountry in mostRefs[:numberOfCountriesShown]:
	with open('graph'+refCountry[0].replace(" ","").translate(string.maketrans("",""), string.punctuation)+'.csv','wb') as csvfile:
		csvwriter = csv.writer(csvfile, delimiter=',', quotechar='|', quoting=csv.QUOTE_MINIMAL)
		c = ['Country']
		c.extend(yrs)
		csvwriter.writerow(c)
		for nation in refsToYearsFrom[refCountry[0]]:
			if any(v > 1000 for v in refsToYearsFrom[refCountry[0]][nation].itervalues()):
				reflist = []
				for y in yrs:
					if y in refsToYearsFrom[refCountry[0]][nation]:
						reflist.append(refsToYearsFrom[refCountry[0]][nation][y])
					else:
						reflist.append(0)
				n = [nation]
				n.extend(reflist)
				csvwriter.writerow(n)
for refCountry in mostRefsFrom[:numberOfCountriesShown]:
	with open('graphFrom'+refCountry[0].replace(" ","").translate(string.maketrans("",""), string.punctuation)+'.csv','wb') as csvfile:
		csvwriter = csv.writer(csvfile, delimiter=',', quotechar='|', quoting=csv.QUOTE_MINIMAL)
		c = ['Country']
		c.extend(yrs)
		csvwriter.writerow(c)
		for nation in refsFromToYears[refCountry[0]]:
			if any(v > 1000 for v in refsFromToYears[refCountry[0]][nation].itervalues()):
				reflist = []
				for y in yrs:
					if y in refsFromToYears[refCountry[0]][nation]:
						reflist.append(refsFromToYears[refCountry[0]][nation][y])
					else:
						reflist.append(0)
				n = [nation]
				n.extend(reflist)
				csvwriter.writerow(n)


			#csvwriter.writerow([refsToYearsFrom[refCountry[0]][nation][y] for nation in refsToYearsFrom[refCountry[0]]])
# with open('graph.csv', 'wb') as csvfile:
#     csvwriter = csv.writer(csvfile, delimiter=',',
#                             quotechar='|', quoting=csv.QUOTE_MINIMAL)
#     for nation in refsFromToYears:
#     	for nation2 in refsFromToYears[nation]:
#     		a = sorted(refsFromToYears[nation][nation2].items(),key=operator.itemgetter(0), reverse=True)
# 	    	print nation, nation2, a
# 	    	csvwriter.writerow([nation,nation2,a])
#now for the countries with largest proportion of refs -- where do they come from?
#line graph that has 100 largest country-to-country refugee flows (like the recovery online graphic in nytimes)
#separate graphs per countries with largest  