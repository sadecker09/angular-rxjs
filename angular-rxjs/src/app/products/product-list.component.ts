import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  constructor(
    private productService: ProductService,
    private productCategoryService: ProductCategoryService
  ) {}
  pageTitle = 'Product List';
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  // Create action stream to react to user's selection
  private categorySelectedSubject = new BehaviorSubject<number>(0);
  categorySelectedAction$ = this.categorySelectedSubject.asObservable();
  // Combine the action stream with the products data stream, allowing
  // us to filter the products
  products$ = combineLatest([
    this.productService.productsWithCategory$,
    // this action stream will emit the selected category id every
    // time the user selects a new category
    this.categorySelectedAction$,
  ]).pipe(
    map(([products, selectedCategoryId]) =>
      products.filter((product) =>
        selectedCategoryId ? product.categoryId === selectedCategoryId : true
      )
    ),
    catchError((err) => {
      this.errorMessageSubject.next(err);
      // return of([]); // this is one option; or use EMPTY
      return EMPTY;
    })
  );

  categories$ = this.productCategoryService.productCategories$.pipe(
    catchError((err) => {
      this.errorMessageSubject.next(err);
      return EMPTY;
    })
  );

  onSelected(categoryId: string): void {
    // Each time action occurs (user selects category),
    // emit the selected CategoryId to the action stream
    // this will re-execute the observable pipeline (product list re-filtered)
    this.categorySelectedSubject.next(+categoryId);
  }

  onAdd(): void {
    console.log('Not yet implemented');
  }
}
