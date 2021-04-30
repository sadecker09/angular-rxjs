import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  pageTitle = 'Product List';
  errorMessage = '';
  categories;

  products$ = this.productService.productsWithCategory$.pipe(
    catchError((err) => {
      this.errorMessage = err; // todo since we changed the ChangeDetectionStrategy, need to push this change
      // return of([]); // this is one option; or use EMPTY
      return EMPTY;
    })
  );;

  constructor(private productService: ProductService) {}

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
    console.log('Not yet implemented');
  }
}
