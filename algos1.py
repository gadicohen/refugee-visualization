import matplotlib.pyplot as plt
import matplotlib
import math
import numpy as np
import scipy.misc

def simple():
    x = np.linspace(0, 10000, 100)
    plt.plot(x,  7*np.power(x,3)-10*x, label="7n^3-10n")
    plt.plot(x,  4*np.power(x,2), label="4n^2")
    plt.plot(x, x, label="n")
    plt.plot(x,  np.power(x,8621909))
    plt.plot(x, np.power(3,x), label="3^n")
    plt.plot(x, np.exp(np.log(np.log(x))), label="e^loglogn")
    plt.plot(x, np.power(x,np.log(x)), label="n^logn")
    plt.plot(x, scipy.misc.factorial(x), label="n!")


    axes = plt.gca()
    axes.set_xlabel('n')
    axes.set_ylabel('f(n)')
    plt.legend(loc='best')
    plt.show()

simple()

# n, 