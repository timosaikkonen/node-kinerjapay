node-kinerjapay
===============

[KinerjaPay](https://www.kinerjapay.com/) SDK for Node.js.

## Install

```
npm install kinerjapay
```

## Use

### Configure

```
var KinerjaClient = require('kinerja');
var kinerja = KinerjaClient({
  merchantAppCode: '123d4c5f6e7d8f9b012345678901234a56b7890abcdf12345678901234567890',
  merchantAppPassword: 'password',
  merchantIPAddress: '192.168.0.1'
  sandbox: true
});
```

### Request payment

```
var payment = {
  customerID: '1234',
  orderNumber: '2345,
  orderValue: 200000,
  products: [
    {
      description: 'Product 1',
      quantity: 1,
      amount: 100000,
    },
    {
      description: 'Product 2',
      quantity: 1,
      amount: 100000,
    }
  ],
  cancelURL: 'https://www.example.com/payment-cancelled/2345',
  returnURL: 'https://www.example.com/payment-approved/2345'
}

kinerja.requestPayment(payment).then(function (response) {
  /* response:
    {
      approvalURL: 'https://www.kinerjapay.com/sandbox/process.php?token=abcd1234',
      token: 'abcd1234'
    }
  */
});
```

### Verify payment

```
var request = {
  token: 'abcd1234'
};

kinerja.verifyPayment(request).then(function (response) {
  /* response
    {
      code: '00',
      message: 'message',
      token: 'abcd1234',
      amount: 200000
    }
  */
});
```

# License

The MIT License (MIT)

Copyright (c) 2015 Timo Saikkonen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
