// Jest runs before any source module loads. Force development mode so the
// production boot-guards (TokenService/MockPaymentGateway, which throw when
// NODE_ENV !== 'development' and the dev placeholder secrets are used) don't
// fire during unit tests. CI sets NODE_ENV=test by default, which would trip them.
process.env.NODE_ENV = 'development';
