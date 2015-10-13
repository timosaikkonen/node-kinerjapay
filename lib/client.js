'use strict';

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var debug = require('debug')('kinerjapay:client');
var xml2js = require('xml2js');
var Promise = require('bluebird');
var KinerjaPayError = require('./error');
var request = require('request');
var handlebars = require('handlebars');

Promise.promisifyAll(fs);
Promise.promisifyAll(xml2js);

/**
 * KinerjaClient - KinerjaPay web services client
 * @param {Object} options - Client options
 * @param {string} options.merchantAppCode - Merchant app code, see KP doc for "Access authorization code"
 * @param {string} options.merchantAppPassword - Merchant password, see KP doc for "Access authorization password"
 * @param {string} options.merchantIPAddress - Server IP address, see KP doc for "Parner web server IP address"
 */
var KinerjaClient = function (options) {
  var _options = options;

  if (!_options)  {
    throw new RangeError('options required');
  }
  if (!_options.merchantAppCode) {
    throw new RangeError('merchantAppCode required');
  }
  if (!_options.merchantAppPassword) {
    throw new RangeError('merchantAppPassword required');
  }
  if (!_options.merchantIPAddress) {
    throw new RangeError('merchantIPAddress required');
  }

  var _requestTemplatePath = path.resolve(path.dirname(module.filename), '../templates/request.hbs');
  var _inquiryTemplatePath = path.resolve(path.dirname(module.filename), '../templates/inquiry.hbs');

  var _baseUrl;
  if (_options.sandbox) {
    _baseUrl = 'https://www.kinerjapay.com/sandbox/';
  } else {
    _baseUrl = 'https://www.kinerjapay.com/';
  }

  var _connectionOptions = _.pick(_options, [
    'merchantAppCode',
    'merchantAppPassword',
    'merchantIPAddress',
    'returnURL',
    'cancelURL',
    'logoURL'
    ]);

  var client = {};

  // KinerjaPay is pretending to speak SOAP, but in reality it doesn't. I tried to
  // hammer an example message into a WSDL document so I could use an actual SOAP library,
  // but ended up with something that wasn't even valid XSD. Slow claps to PHP's SOAP implementation.
  var _makeRequest = function (options) {
    return fs.readFileAsync(options.template, 'utf8').then(function (template) {
      return handlebars.compile(template);
    }).then(function (template) {
      var p = Promise.defer();
      var payload = template(options.data);

      debug('requesting payment:', payload);

      request({
        method: 'POST',
        url: options.url,
        body: payload,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8'
        }
      }, function (err, res, body) {
        if (err) {
          return p.reject(err);
        }

        return p.resolve(body);
      });

      return p.promise;
    }).then(function (response) {
      debug('requestPayment returned:', response);
      return xml2js.parseStringAsync(response);
    }).then(function (xml) {
      debug('xml:', xml);
      var soapBody = xml['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0];
      if (!soapBody.result || !soapBody.result.length) {
        return Promise.reject(new KinerjaPayError('Empty response body'));
      }

      var result = soapBody.result[0];
      if (typeof result === 'string') {
        return xml2js.parseStringAsync(result);
      } else {
        return result;
      }
    }).catch(function (err) {
      debug('payment request failed:', err);
      return Promise.reject(KinerjaPayError(null, err));
    });
  };

  /**
   * requestPayment - Request a payment
   * @param {Object} options - Payment options
   * @param {string} options.customerID - Buyer identity
   * @param {string} options.orderNumber - Sales transaction order number
   * @param {string} options.orderValue - Total transaction amount
   * @param {string} options.returnURL - URL to redirect to after payment has been made
   * @param {string} options.cancelURL - URL to redirect to after payment cancellation
   * @param {string} options.logoURL - URL to your logo to be displayed on payment page
   * @param {Object[]} options.products - Order products
   * @param {string} options.products[].description - Product description
   * @param {string} options.products[].quantity - Quantity
   * @param {string} options.products[].amount - Product price
   */
  client.requestPayment = function (options) {
    var requestOptions = _.extend(_.clone(options), _connectionOptions);
    requestOptions.productList = requestOptions.products.map(function (product, i) {
      return {
        productNo: i,
        productDesc: product.description,
        productQuant: product.quantity,
        productAmount: product.amount
      };
    });

    delete requestOptions.products;

    debug('calling requestPayment with:', requestOptions);

    return _makeRequest({
      template: _requestTemplatePath,
      data: requestOptions,
      url: _baseUrl + 'services/request.php'
    }).then(function (result) {
      debug('result:', result);
      if (result.response.code[0] !== '00') {
        return Promise.reject(KinerjaPayError(result.response));
      }

      var token = result.response.token[0];

      var response = {
        token: token,
        approvalURL: _baseUrl + 'process.php?token=' + token
      };

      return response;
    });
  };


  /**
   * verifyPayment - Verify payment
   * @param {Object} options - Request options
   * @param {string} options.token - Payment token
   */
  client.verifyPayment = function (options) {
    var requestOptions = _.extend(_.clone(options), _connectionOptions);

    return _makeRequest({
      template: _inquiryTemplatePath,
      data: requestOptions,
      url: _baseUrl + 'services/inquiry.php'
    }).then(function (result) {
      debug('result:', result);
      if (result.response.code[0] !== '00') {
        return Promise.reject(KinerjaPayError(result.response));
      }
      var response = {
        code: result.response.code[0],
        message: result.response.message[0],
        token: result.response.token[0],
        amount: result.response.payamount[0]
      };

      return response;
    });
  };

  return client;
};

module.exports = KinerjaClient;