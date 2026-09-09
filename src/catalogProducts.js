import data0 from './catalogData0.js';
import data1 from './catalogData1.js';
import data2 from './catalogData2.js';
import data3 from './catalogData3.js';
import data4 from './catalogData4.js';
import data5 from './catalogData5.js';
import data6 from './catalogData6.js';
import sprite0 from './catalogSprite0.js';
import sprite1 from './catalogSprite1.js';
import sprite2 from './catalogSprite2.js';
import sprite3 from './catalogSprite3.js';
import sprite4 from './catalogSprite4.js';
import sprite5 from './catalogSprite5.js';
import sprite6 from './catalogSprite6.js';
import sprite7 from './catalogSprite7.js';

export const CATALOG_SPRITE_DATA = `data:image/webp;base64,${sprite0 + sprite1 + sprite2 + sprite3 + sprite4 + sprite5 + sprite6 + sprite7}`;

const ROWS = [...data0, ...data1, ...data2, ...data3, ...data4, ...data5, ...data6];

export const CATALOG_PRODUCTS = ROWS.map((row, index) => {
  const [article, department, gender, category, subcategory, name, material, price, discount, color, collection, silhouette, ageGroup, fit, length, sleeveLength, details, stockValue, l7d, isNew, imageFile] = row;
  const stock = Number(stockValue || 0);
  return {
    id: article,
    article,
    department,
    gender,
    category,
    subcategory,
    name,
    material,
    price: Number(price || 0),
    discount: Number(discount || 0),
    color,
    collection,
    silhouette,
    ageGroup,
    fit,
    length,
    sleeveLength,
    details,
    stockValue: stock,
    stock: { RU: stock, KZ: stock, GCC: stock, WW: stock },
    l7d: Number(l7d || 0),
    isNew: isNew === 'Да',
    imageFile,
    spriteX: index % 14,
    spriteY: Math.floor(index / 14),
    spriteCols: 14,
    spriteRows: 10,
  };
});

export const CATALOG_META = {
  productCount: CATALOG_PRODUCTS.length,
  imageCount: CATALOG_PRODUCTS.filter((product) => product.imageFile).length,
  stockField: 'Остатки',
  stockScope: 'В CSV указан один показатель остатка без разбивки по регионам',
};

export const CATALOG_COLLECTIONS = [...new Set(CATALOG_PRODUCTS.map((product) => product.collection).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
export const CATALOG_DEPARTMENTS = [...new Set(CATALOG_PRODUCTS.map((product) => product.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
export const CATALOG_CATEGORIES = [...new Set(CATALOG_PRODUCTS.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
