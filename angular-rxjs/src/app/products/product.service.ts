import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  from,
  merge,
  Observable,
  Subject,
  throwError,
} from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  scan,
  shareReplay,
  switchMap,
  tap,
  toArray,
} from 'rxjs/operators';
import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategoryService } from '../product-categories/product-category.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private supplierService: SupplierService,
    private productCategoryService: ProductCategoryService
  ) {}
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http.get<Product[]>(this.productsUrl).pipe(
    // tap((data) => console.log('Products: ', JSON.stringify(data))),
    catchError(this.handleError)
  );

  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$,
  ]).pipe(
    map(([products, categories]) =>
      products.map(
        (product) =>
          ({
            ...product,
            price: product.price * 1.5,
            category: categories.find((c) => product.categoryId === c.id).name,
            searchKey: [product.productName],
          } as Product)
      )
    ),
    // added replay here instead of in products$ so that the computation to map
    // a product to its category doesn't need to be redone on each subscription
    shareReplay(1)
  );

  // Action stream for making a product selection
  private productSelectedSubject = new BehaviorSubject<number>(0);
  productSelectedAction$ = this.productSelectedSubject.asObservable();
  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }
  // Combine product data stream and selection action stream to filter the
  // products to the one selected
  selectedProduct$ = combineLatest([
    this.productsWithCategory$,
    this.productSelectedAction$,
  ]).pipe(
    map(([products, selectedProductId]) =>
      products.find((product) => product.id === selectedProductId)
    ),
    tap((product) => console.log('selectedProduct', product)),
    shareReplay(1)
  );

  // Action stream for adding a new product
  private productInsertedSubject = new Subject<Product>();
  productInsertedAction$ = this.productInsertedSubject.asObservable();
  // Combine the product data stream and the add action stream,
  // resulting in a new array that contains the original products plus
  // the newly added product
  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertedAction$
  ).pipe(scan((acc: Product[], value: Product) => [...acc, value]));

  /* Using combineLatest to combine the selected product stream with the 
  data stream of all suppliers.
  selectedProduct$ stream already combines productsWithCategory stream and the 
  productSelectedAction stream so it emits each time the user selects a product
  (This is the "Get it all" approach; compare with the "Just in time" approach below)
  */
  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,
  //   this.supplierService.suppliers$,
  // ]).pipe(
  //   map(([selectedProduct, suppliers]) =>
  //     suppliers.filter((supplier) =>
  //       selectedProduct.supplierIds.includes(supplier.id)
  //     )
  //   )
  // );


  // This is the "Just in time" approach; compare with the "Get it all" approach above
  // Get the data just when it is needed
  selectedProductSuppliers$ = this.selectedProduct$.pipe(
    // Use filter to skip the merging process if selectedProduct is undefined or null (e.g. when page first loads and user has not yet selected a product)
    // Boolean will return false if value is false, undefined, or null
    filter((selectedProduct) => Boolean(selectedProduct)),
    // compare using mergeMap instead of switchMap (watch the tap's console.log); if using mergeMap and the user quickly chooses different products, you'll see a get request for each one of those. But using switchMap, the request will get canceled and switch to the latest one that the user chooses. This is more efficient and produces less network traffic
    // switchMap will transform the selected product into an observable
    switchMap((selectedProduct) =>
      // use from to create an inner observable from the product's array of supplier Ids, emits each id, and completes
      from(selectedProduct.supplierIds).pipe(
        // each supplierid gets piped into a mergeMap; the map part transforms each supplierId
        // into an observable returned from http get
        // each inner observable returns one response, which is the supplier
        // the merge part of mergeMap merges the result into a single stream but since the UI
        // needs an array of suppliers, use toArray, so it can use the ngFor directive to iterate them for display.
        mergeMap((supplierId) =>
          this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)
        ),
        toArray(), // waits for all inner observables to complete before emitting the array; each individual supplier combined into a single array
        // note that selectedProduct$ action stream doesn't complete; but the from(selectedProduct.supplierIds) creates a separate context
        // The from creation function will create an observable stream that emits its array elements and completes
        // since the toArray is within this context, toArray will complete
        // This inner observable technique can also be used when encapsulating operations that could generate an error when you don't want the error to stop the outer observable. 
        tap((suppliers) =>
          console.log('product suppliers', JSON.stringify(suppliers))
        )
      )
    )
  );

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      // category: 'Toolbox',
      quantityInStock: 30,
    };
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }
}
