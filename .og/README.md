# Preview image

`og.html` is the source of `../og.png`, the image link previews use.

To regenerate after editing it, from the repo root:

```
npx --yes playwright@latest screenshot \
  --viewport-size "2400,1260" "file://$PWD/.og/og.html" og.png
```

The card is written at 1200x630 and shot at twice that, so the PNG is a retina
asset. `html { zoom: 2 }` does the scaling; the meta tags keep declaring
1200x630, which is the ratio crawlers read.
