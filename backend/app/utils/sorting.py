from sqlalchemy.orm import Query

def apply_sorting(query: Query, model, sort_by: str = None, sort_order: str = "desc", default_sort_column=None) -> Query:
    """
    Applies dynamic sorting to an SQLAlchemy query.
    
    :param query: SQLAlchemy Query object.
    :param model: The SQLAlchemy model class.
    :param sort_by: The column name to sort by.
    :param sort_order: 'asc' or 'desc'.
    :param default_sort_column: Default column to sort by if sort_by is not provided.
    """
    if sort_by and hasattr(model, sort_by):
        column = getattr(model, sort_by)
        if sort_order and sort_order.lower() == "asc":
            query = query.order_by(column.asc())
        else:
            query = query.order_by(column.desc())
    elif default_sort_column is not None:
        # Default order is usually descending, but we just follow what the caller passes or assume desc for created_at
        if sort_order and sort_order.lower() == "asc":
             query = query.order_by(default_sort_column.asc())
        else:
             query = query.order_by(default_sort_column.desc())
    return query
