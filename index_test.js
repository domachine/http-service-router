import test from 'ava'
import createRouter from '.'

test('rewrites url properly', t => {
  const router = createRouter([
    [/^\/test$/, 42]
  ])
  const r = router.match('/test?foo=bar')
  t.is(r.url, '/?foo=bar')
})

test('returns a matching service', t => {
  const router = createRouter([
    [/^\/test$/, 1],
    [/^\/testinger/, 2]
  ])
  const r = router.match('/testinger/api?foo=bar')
  t.is(r.url, '/api?foo=bar')
  t.is(r.service, 2)
})
