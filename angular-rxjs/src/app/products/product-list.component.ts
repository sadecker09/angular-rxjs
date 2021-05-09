import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  pageTitle = 'Product List';
  errorMessage = '';
  private categorySelectedSubject = new Subject<number>();
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();
  products$ = combineLatest([
    this.productService.productsWithCategory$,
    this.categorySelectedAction$.pipe(
      // use startWith the initialize a value; otherwise, on initial page load, the categorySelectedAction stream will not emit and so then b/c of how combineLatest works, neither will the productsWtihCategory stream
      // another way to accomplish this would be to use BehaviorSubject instead of a Subject (see next commit)
      startWith(0)
    ),
  ]).pipe(
    map(([products, selectedCategoryId]) =>
      products.filter((product) =>
        selectedCategoryId ? product.categoryId === selectedCategoryId : true
      )
    ),
    catchError((err) => {
      this.errorMessage = err; // todo since we changed the ChangeDetectionStrategy, need to push this change
      // return of([]); // this is one option; or use EMPTY
      return EMPTY;
    })
  );

  categories$ = this.productCategoryService.productCategories$.pipe(
    catchError((err) => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

  constructor(
    private productService: ProductService,
    private productCategoryService: ProductCategoryService
  ) {}

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
    // emimt the selected CategoryId to the stream
    this.categorySelectedSubject.next(+categoryId);
  }
}
