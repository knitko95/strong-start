# Bun source

Source asset: `rehmanpolanski_hair_bun_brown`, by Rehman Polanski / RehmanPolanski.
Retrieved November 14, 2026 from the official MakeHuman Hair 01 CC0 archive:

- [Per-asset author and CC0 listing](https://static.makehumancommunity.org/assets/assetpacks/hair01.html)
- [Official download](https://files2.makehumancommunity.org/asset_packs/hair01/hair01_cc0.zip)
- [Asset-pack licensing explanation](https://static.makehumancommunity.org/assets/assetpacks/faq.html)

The original OBJ, MHCLO, material and PNG are retained unchanged. The OBJ and
MHCLO have legacy MakeClothes `AGPL3` exporter headers; the current official
register explicitly lists this named graphical asset as CC0. Both pieces of
provenance are retained here instead of deleting the historical header. The
CC0 graphical-asset text is also included in the application's asset license.

`authored_bun.py` converts scale/axes, fits intersections around the existing
head, reduces and asymmetrically shapes the bun, and remaps the visible tie to
the original texture's brown strand tile. Twelve additional alpha-tapered wisps
use the existing generated sparse strand source. Every hair vertex is bound to
the accepted head bone. No source skeleton, motion or equipment is imported.

The author's model and texture provide the base for the adapted hairstyle;
they are not claimed as newly created original geometry or generated imagery.
Runtime delivery uses the combined model atlas rather than the original PNG.
