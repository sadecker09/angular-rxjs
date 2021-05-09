import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  selectedCategoryId = 1;

  products$ = this.productService.productsWithCategory$.pipe(
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

  productsSimpleFilter$ = this.productService.productsWithCategory$.pipe(
    map((products) =>
      products.filter((product) =>
        this.selectedCategoryId
          ? product.categoryId === this.selectedCategoryId
          : true
      )
    )
  );

  constructor(
    private productService: ProductService,
    private productCategoryService: ProductCategoryService
  ) {}

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
   this.selectedCategoryId = +categoryId;
  }
}
